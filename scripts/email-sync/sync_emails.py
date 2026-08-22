#!/usr/bin/env python3
"""
Email Sync Script - Phase 2
Uses himalaya CLI to fetch emails via IMAP and sync to Supabase.

For each active email account:
- Fetches recent emails from INBOX
- Matches sender/recipient to leads, accounts, contacts
- Stores in emails table with thread grouping
- Updates email account last_sync_at

Usage:
  python scripts/email-sync/sync_emails.py [--account <email_id>]

Environment:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (required)
  HIMALAYA_CONFIG_DIR (optional, defaults to ~/.config/himalaya)
"""

import os
import sys
import json
import subprocess
import re
from datetime import datetime, timedelta

from supabase import create_client

# Initialize Supabase client with service role (bypasses RLS)
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

# Sync configuration
SYNC_DAYS = 3  # How many days of emails to fetch per sync
MAX_EMAILS_PER_ACCOUNT = 50  # Cap to prevent runaway syncs


def parse_email_address(header_value: str):
    """Parse 'Name <email@example.com>' or just 'email@example.com'."""
    if not header_value:
        return None, None

    # Handle "Name <email>" format
    match = re.match(r'^(.*?)\s*<(.+?)>', header_value)
    if match:
        name = match.group(1).strip().strip('"')
        email = match.group(2).strip()
    else:
        # Just email address
        email = header_value.strip().strip('<>')
        name = None

    # Clean up email
    email = email.lower().strip()
    return name, email


def parse_recipients(header_value: str):
    """Parse comma-separated email addresses."""
    if not header_value:
        return []

    recipients = []
    # Split on comma, but handle "Name <email>, Name <email>" format
    parts = re.split(r',\s*(?=[^@]*<)', header_value)
    if len(parts) == 1:
        parts = header_value.split(',')

    for part in parts:
        name, email = parse_email_address(part.strip())
        if email:
            recipients.append({
                "email": email,
                "name": name or email.split('@')[0]
            })

    return recipients


def fetch_emails_via_himalaya(account_email: str):
    """Use himalaya CLI to fetch emails from the account's INBOX."""
    try:
        # Fetch emails as JSON, sorted by date descending
        cmd = [
            "himalaya",
            "--account", account_email,
            "envelope", "list",
            "--folder", "INBOX",
            "--output", "json",
            "--sort", "reverse-arrival",
            "--page-size", str(MAX_EMAILS_PER_ACCOUNT),
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

        if result.returncode != 0:
            print(f"  himalaya error for {account_email}: {result.stderr[:200]}")
            return []

        emails = json.loads(result.stdout)
        return emails

    except FileNotFoundError:
        print(f"  ERROR: himalaya CLI not installed. Install: curl -sSL https://raw.githubusercontent.com/pimalaya/himalaya/master/install.sh | PREFIX=~/.local sh")
        return []
    except json.JSONDecodeError as e:
        print(f"  ERROR: Failed to parse himalaya JSON output: {e}")
        return []
    except subprocess.TimeoutExpired:
        print(f"  ERROR: himalaya timed out fetching emails for {account_email}")
        return []


def fetch_email_body(account_email: str, message_id: str):
    """Fetch the full body of a single email via himalaya."""
    try:
        cmd = [
            "himalaya",
            "--account", account_email,
            "message", "read", message_id,
            "--output", "json",
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            return None

        return json.loads(result.stdout)

    except Exception:
        return None


def match_email_to_record(email: str):
    """Try to match an email address to a lead, account, or contact."""
    # Check leads
    leads = supabase.table("leads").select("id, email").eq("email", email).execute()
    if leads.data and len(leads.data) > 0:
        return "leads", leads.data[0]["id"]

    # Check contacts
    contacts = supabase.table("contacts").select("id, email").eq("email", email).execute()
    if contacts.data and len(contacts.data) > 0:
        return "contacts", contacts.data[0]["id"]

    # Check accounts (via contacts)
    accounts = supabase.table("accounts").select("id, email").eq("email", email).execute()
    if accounts.data and len(accounts.data) > 0:
        return "accounts", accounts.data[0]["id"]

    return None, None


def compute_thread_id(subject: str, participants: list):
    """Compute a thread ID for grouping related emails."""
    # Strip common prefixes like Re:, Fw:, etc.
    clean_subject = re.sub(r'^(re|fwd?|aw|sv): ', '', subject.strip(), flags=re.IGNORECASE)
    # Use subject + earliest participant as thread key
    sorted_emails = sorted([p["email"] for p in participants if p.get("email")])
    thread_key = clean_subject.lower() + "|" + "|".join(sorted_emails[:2])
    # Generate a stable hash-like string
    import hashlib
    return hashlib.md5(thread_key.encode()).hexdigest()[:24]


def sync_account_emails(account: dict):
    """Sync emails for a single email account."""
    account_id = account["id"]
    account_email = account["email"]
    sync_frequency = account.get("sync_frequency_minutes", 15)
    sync_enabled = account.get("sync_enabled", True)

    if not sync_enabled:
        print(f"  Skipping {account_email} (sync disabled)")
        return

    print(f"  Syncing emails for {account_email}...")

    # Fetch emails from IMAP
    emails = fetch_emails_via_himalaya(account_email)
    if not emails:
        print(f"    No emails fetched or error occurred")
        # Update connection status
        supabase.table("email_accounts").update({
            "connection_status": "error",
            "last_sync_at": datetime.utcnow().isoformat(),
        }).eq("id", account_id).execute()
        return

    synced_count = 0
    linked_count = 0

    for raw_email in emails:
        # Check if email already exists by message_id
        existing = supabase.table("emails").select("id").eq("message_id", raw_email.get("message_id")).execute()
        if existing.data and len(existing.data) > 0:
            continue

        # Parse sender and recipients
        from_name, from_email = parse_email_address(raw_email.get("from", ""))
        to_recipients = parse_recipients(raw_email.get("to", ""))
        cc_recipients = parse_recipients(raw_email.get("cc", ""))

        all_participants = [{"email": from_email, "name": from_name}] + to_recipients + cc_recipients

        # Determine direction (inbound if from is not this account, outbound otherwise)
        direction = "inbound" if from_email != account_email else "outbound"

        # Compute thread ID for grouping
        thread_id = raw_email.get("thread_id") or compute_thread_id(
            raw_email.get("subject", ""), all_participants
        )

        # Match to existing records
        related_to_table = None
        related_to_id = None
        contact_id = None

        if direction == "inbound":
            # Match sender to lead/account/contact
            related_to_table, related_to_id = match_email_to_record(from_email)
            if related_to_table == "contacts":
                contact_id = related_to_id
        else:
            # For outbound, match first recipient
            if to_recipients:
                related_to_table, related_to_id = match_email_to_record(to_recipients[0]["email"])
                if related_to_table == "contacts":
                    contact_id = related_to_id

        # Build email record
        email_record = {
            "account_id": account_id,
            "message_id": raw_email.get("message_id"),
            "thread_id": thread_id,
            "subject": raw_email.get("subject", ""),
            "snippet": raw_email.get("summary", "")[:200],
            "body": raw_email.get("text", "")[:5000],  # Limit size
            "body_html": raw_email.get("html", "")[:10000] if raw_email.get("html") else None,
            "from": json.dumps([{"email": from_email, "name": from_name or None}]) if from_email else None,
            "to": json.dumps(to_recipients) if to_recipients else None,
            "cc": json.dumps(cc_recipients) if cc_recipients else None,
            "bcc": None,
            "related_to_table": related_to_table,
            "related_to_id": related_to_id,
            "contact_id": contact_id,
            "direction": direction,
            "is_read": raw_email.get("read") or False,
            "is_starred": raw_email.get("flagged") or False,
            "is_replied_to": False,
            "sent_at": raw_email.get("date"),
            "received_at": datetime.utcnow().isoformat(),
            "folder": "INBOX",
            "size_bytes": raw_email.get("size", 0),
            "has_attachments": len(raw_email.get("attachments", [])) > 0 if raw_email.get("attachments") else False,
        }

        # Insert email
        result = supabase.table("emails").insert(email_record).execute()
        if result.data and len(result.data) > 0:
            synced_count += 1
            if related_to_table:
                linked_count += 1

    # Update account last sync time
    supabase.table("email_accounts").update({
        "last_sync_at": datetime.utcnow().isoformat(),
        "connection_status": "connected",
        "last_error": None,
    }).eq("id", account_id).execute()

    print(f"    Synced {synced_count} emails ({linked_count} linked to records)")
    return synced_count, linked_count


def main():
    """Main sync entry point."""
    print("=" * 60)
    print("Nexus CRM Email Sync (Phase 2)")
    print(f"Started at: {datetime.utcnow().isoformat()}")
    print("=" * 60)

    # Get target account from args, or fetch all active accounts
    target_email = None
    if "--account" in sys.argv:
        idx = sys.argv.index("--account")
        if idx + 1 < len(sys.argv):
            target_email = sys.argv[idx + 1]

    query = supabase.table("email_accounts").select("*" if target_email else "*").eq("is_active", True)
    if target_email:
        query = supabase.table("email_accounts").select("*").eq("email", target_email)

    result = query.execute()
    accounts = result.data or []

    if not accounts:
        print("No active email accounts found. Add one in Settings → Email Accounts.")
        return

    print(f"\nFound {len(accounts)} active email account(s)")

    total_synced = 0
    total_linked = 0

    for account in accounts:
        print(f"\nProcessing: {account['email']}")
        results = sync_account_emails(account)
        if results:
            synced, linked = results
            total_synced += synced
            total_linked += linked

    print(f"\n{'=' * 60}")
    print(f"Sync complete: {total_synced} emails synced, {total_linked} linked to records")
    print(f"Finished at: {datetime.utcnow().isoformat()}")
    print("=" * 60)


if __name__ == "__main__":
    main()
