import { internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { normalizeItemNameWithLLM } from "./llmUtils";
import { internal, api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Add a new item to the itemDefinitions table after normalizing it with LLM
 * This builds up a list of standardized grocery items for autocomplete
 */
export const addItemDefinition = mutation({
  args: {
    item: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    // Schedule the normalization and storage process
    ctx.scheduler.runAfter(0, internal.groceryItems.normalizeAndStoreItem, {
      originalItem: args.item,
      image: args.image,
    });

    return { success: true };
  },
});

/**
 * Internal action that normalizes an item name and stores it in the itemDefinitions table
 * if it doesn't already exist
 */
export const normalizeAndStoreItem = internalAction({
  args: {
    originalItem: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    success: boolean;
    alreadyExists?: boolean;
    itemId?: Id<"itemDefinitions">;
    error?: string;
  }> => {
    console.log(`Processing item: ${args.originalItem}`);

    // Normalize the item name using LLM
    const normalizationResult = await normalizeItemNameWithLLM(args.originalItem);

    // If normalization failed, log the error and exit
    if (!normalizationResult.success) {
      console.error(`Failed to normalize item "${args.originalItem}": ${normalizationResult.error}`);
      return { success: false, error: normalizationResult.error };
    }

    const normalizedName = normalizationResult.normalizedName!;
    console.log(`Normalized "${args.originalItem}" to "${normalizedName}"`);

    // Check if the normalized item already exists in the database
    const existingItems = (await ctx.runQuery(api.groceryItems.searchItemDefinitions, {
      query: normalizedName,
      exact: true,
    })) as Doc<"itemDefinitions">[];

    // If the item already exists, no need to add it again
    if (existingItems.length > 0) {
      console.log(`Item "${normalizedName}" already exists in the database`);
      return { success: true, alreadyExists: true, itemId: existingItems[0]._id };
    }

    // Add the normalized item to the database
    const itemId = (await ctx.runMutation(api.groceryItems.storeItemDefinition, {
      item: normalizedName,
      image: args.image,
    })) as Id<"itemDefinitions">;

    console.log(`Added new item "${normalizedName}" to the database with ID ${itemId}`);
    return { success: true, alreadyExists: false, itemId };
  },
});

/**
 * Internal mutation to store an item definition
 */
export const storeItemDefinition = mutation({
  args: {
    item: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"itemDefinitions">> => {
    return await ctx.db.insert("itemDefinitions", {
      item: args.item,
      image: args.image,
    });
  },
});

/**
 * Search for item definitions by name
 * Used internally to check if an item already exists
 */
export const searchItemDefinitions = query({
  args: {
    query: v.string(),
    exact: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<Doc<"itemDefinitions">[]> => {
    if (args.exact) {
      // For exact matches, use a filter
      return await ctx.db
        .query("itemDefinitions")
        .filter(q => q.eq(q.field("item"), args.query))
        .collect();
    } else {
      // For partial matches, use the search index
      // This leverages Convex's prefix matching for the last term
      // which is perfect for autocomplete functionality
      return await ctx.db
        .query("itemDefinitions")
        .withSearchIndex("search_item", q => q.search("item", args.query))
        .collect();
    }
  },
});

/**
 * Public query to search for item definitions
 * Used for autocomplete in the UI
 *
 * This query is optimized for typeahead search experiences:
 * - Uses prefix matching for the last term in the query
 * - Returns results in relevance order
 * - Limits results to prevent performance issues
 */
export const searchItems = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Doc<"itemDefinitions">[]> => {
    const limit = args.limit ?? 10;

    // If query is empty, return most recently added items
    if (!args.query.trim()) {
      return await ctx.db.query("itemDefinitions").order("desc").take(limit);
    }

    // For search queries, use the search index
    // The search index automatically handles:
    // - Prefix matching on the last term (great for autocomplete)
    // - Relevance ordering based on BM25 score
    // - Case insensitivity and punctuation handling
    return await ctx.db
      .query("itemDefinitions")
      .withSearchIndex("search_item", q => q.search("item", args.query))
      .take(limit);
  },
});

/**
 * Get all item definitions with pagination support
 */
export const getAllItemDefinitions = query({
  args: {
    // Optional cursor for pagination
    cursor: v.optional(v.string()),
    // Number of items to return per page
    pageSize: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    items: Doc<"itemDefinitions">[];
    continueCursor: string | null;
  }> => {
    const pageSize = args.pageSize ?? 50;

    // Use pagination to avoid hitting Convex's limits
    const paginationResult = await ctx.db
      .query("itemDefinitions")
      .order("asc")
      .paginate({ cursor: args.cursor ?? null, numItems: pageSize });

    return {
      items: paginationResult.page,
      continueCursor: paginationResult.continueCursor,
    };
  },
});

/**
 * Process a grocery list to add all items to the item definitions
 * Useful for bootstrapping the autocomplete database from existing lists
 */
export const processGroceryListForDefinitions = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    alreadyExisted: number;
    newlyAdded: number;
  }> => {
    // Get all grocery list items
    const groceryItems: Doc<"groceryList">[] = await ctx.runQuery(api.groceryList.getAllItems, {});

    // Define the type for normalization results
    type NormalizationResult = {
      success: boolean;
      alreadyExists?: boolean;
      itemId?: Id<"itemDefinitions">;
      error?: string;
    };

    // Process each item
    const results: NormalizationResult[] = await Promise.all(
      groceryItems.map(
        (item: Doc<"groceryList">) =>
          ctx.runAction(internal.groceryItems.normalizeAndStoreItem, {
            originalItem: item.item,
          }) as Promise<NormalizationResult>,
      ),
    );

    return {
      processed: results.length,
      succeeded: results.filter((r: NormalizationResult) => r.success).length,
      failed: results.filter((r: NormalizationResult) => !r.success).length,
      alreadyExisted: results.filter((r: NormalizationResult) => r.success && r.alreadyExists).length,
      newlyAdded: results.filter((r: NormalizationResult) => r.success && !r.alreadyExists).length,
    };
  },
});
