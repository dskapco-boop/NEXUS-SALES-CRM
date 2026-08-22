import json, urllib.request, os

anon_key = None
with open(r"C:\Users\smith/nexus-crm/.env") as f:
    for line in f:
        if "SUPABASE_ANON_KEY=" in line:
            anon_key = line.split("=", 1)[1].strip()

base_url = "https://nsdwlywlvppqfuglpekt.supabase.co/rest/v1"

# Query with anon key - we know this returns 0 leads due to RLS
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {anon_key}",
    "apikey": anon_key,
}

# Check: can we query leads with select=count? 
req = urllib.request.Request(f"{base_url}/leads?select=count", headers=headers)
try:
    resp = urllib.request.urlopen(req, timeout=10)
    print(f"Leads count: {resp.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Leads count error: {e.code}")

# The problem is clear: 
# - lead_pipelines, lead_stages, pipeline_stages: public SELECT (USING (true)) → readable with anon key
# - leads table: requires auth.uid() IS NOT NULL → NOT readable without auth session
#
# In the browser, when a user logs in via react-admin auth provider:
# 1. getSupabaseClient() singleton stores the session in localStorage
# 2. Subsequent calls to getSupabaseClient() have the auth session
# 3. The data provider (react-admin) fetches leads with the session → 9 leads returned
# 4. The KanbanBoard receives these 9 leads via listContext.data
# 5. The KanbanBoard ALSO calls getSupabaseClient() to fetch pipeline stages → should work with session
#
# BUT: if the session hasn't been restored yet when KanbanBoard's useEffect runs,
# the pipeline fetch would fail, and stages would fall back to DEFAULT_STAGES.
# The DEFAULT_STAGES have id="new", "follow_up", etc. — which are codes, not UUIDs.
# The enrichment would fail (idCodeMap is empty), and leads would use _mapped_stage.
# _mapped_stage = statusToStageMap[lead.status]
# If lead.status = "new", mapped = "new" → matches stage.id="new" ✅
# If lead.status = "contacted", mapped = "follow_up" → matches stage.id="follow_up" ✅
# etc.
#
# So even with fallback, leads SHOULD appear in columns.
# Unless... the status values in the DB are different.
# Let's check what status values exist by querying the enum type:
print("\nChecking lead status distribution...")
# Can't query leads table without auth, but we can check the DB schema
req2 = urllib.request.Request(f"{base_url}/leads?select=status", headers=headers)
try:
    resp2 = urllib.request.urlopen(req2, timeout=10)
    print(f"Status query result: {resp2.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Status query blocked by RLS: {e.code}")