import { getSupabaseClient } from "@nexus-crm/api";
import { DataProvider, SortSpecifier, fetchUtils } from "react-admin";
import { SupabaseClient } from "@supabase/supabase-js";

const supabase = getSupabaseClient();

function mapSupabaseToRecords(data: any[]) {
  return data?.map((item) => ({
    id: item.id,
    ...item,
  })) ?? [];
}

// Enhanced Supabase data provider for React Admin
export const supabaseDataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 25 };
    const { field, order } = params.sort || { field: "created_at", order: "DESC" };
    const filters = params.filter || {};

    let query = supabase.from(resource).select("*", { count: "exact" });

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (key === "q") {
        // Handle search query
        query = query.ilike("name", `%${value}%`);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Handle complex filters like _gte, _lte
        Object.entries(value).forEach(([op, opValue]) => {
          const columnName = key.replace(`_${op}`, "");
          switch (op) {
            case "gte":
              query = query.gte(columnName, opValue as any);
              break;
            case "lte":
              query = query.lte(columnName, opValue as any);
              break;
            case "gt":
              query = query.gt(columnName, opValue as any);
              break;
            case "lt":
              query = query.lt(columnName, opValue as any);
              break;
            case "q":
              query = query.ilike(columnName, `%${opValue}%`);
              break;
            default:
              query = query.eq(columnName, opValue as any);
          }
        });
      } else if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (value !== null && value !== undefined) {
        query = query.eq(key, value as any);
      }
    });

    // Apply sorting
    query = query.order(field, { ascending: order === "ASC" });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: mapSupabaseToRecords(data ?? []),
      total: count ?? 0,
    };
  },

  getOne: async (resource, params) => {
    const { data, error } = await supabase
      .from(resource)
      .select("*")
      .eq("id", params.id)
      .single();
    if (error) throw error;
    return { data: { id: data.id, ...data } };
  },

  getMany: async (resource, params) => {
    const { data, error } = await supabase
      .from(resource)
      .select("*")
      .in("id", params.ids);
    if (error) throw error;
    return { data: mapSupabaseToRecords(data ?? []), total: data?.length ?? 0 };
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 25 };
    const { field, order } = params.sort || { field: "created_at", order: "DESC" };
    const filters = { ...params.filter };

    let query = supabase.from(resource).select("*", { count: "exact" });

    // Apply filters (including reference filter from the URL)
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.entries(value).forEach(([op, opValue]) => {
          const columnName = key.replace(`_${op}`, "");
          switch (op) {
            case "gte":
              query = query.gte(columnName, opValue as any);
              break;
            case "lte":
              query = query.lte(columnName, opValue as any);
              break;
            default:
              query = query.eq(columnName, opValue as any);
          }
        });
      } else if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (value !== null && value !== undefined) {
        query = query.eq(key, value as any);
      }
    });

    // Apply sorting
    query = query.order(field, { ascending: order === "ASC" });

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: mapSupabaseToRecords(data ?? []),
      total: count ?? 0,
    };
  },

  update: async (resource, params) => {
    const { data, error } = await supabase
      .from(resource)
      .update(params.data)
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;
    return { data: { id: data.id, ...data } };
  },

  updateMany: async (resource, params) => {
    for (const id of params.ids) {
      const { error } = await supabase
        .from(resource)
        .update(params.data)
        .eq("id", id);
      if (error) throw error;
    }
    return { data: params.ids };
  },

  create: async (resource, params) => {
    const { data: { user } } = await supabase.auth.getUser();
    const now = new Date().toISOString();
    
    const createData = {
      ...params.data,
      // Auto-set owner_id and created_by to current user if not already set
      ...(user?.id && {
        owner_id: params.data.owner_id || user.id,
        created_by: params.data.created_by || user.id,
      }),
      created_at: params.data.created_at || now,
      updated_at: params.data.updated_at || now,
    };
    
    const { data, error } = await supabase
      .from(resource)
      .insert(createData)
      .select()
      .single();
    if (error) throw error;
    return { data: { id: data.id, ...data } };
  },

  delete: async (resource, params) => {
    const { error } = await supabase
      .from(resource)
      .delete()
      .eq("id", params.id);
    if (error) throw error;
    return { data: { id: params.id, ...params.previousData } };
  },

  deleteMany: async (resource, params) => {
    const { error } = await supabase
      .from(resource)
      .delete()
      .in("id", params.ids);
    if (error) throw error;
    return { data: [...params.ids] };
  },
};
