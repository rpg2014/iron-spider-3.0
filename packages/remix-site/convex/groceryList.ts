import { internalAction, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { DepartmentConfig } from "~/components/GroceryList/GroceryModel";
import { categorizeItemWithLLM } from "./llmUtils";
import { Doc, Id } from "./_generated/dataModel";

export const addGroceryItem = mutation({
  args: {
    item: v.string(),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    notes: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    const itemId = await ctx.db.insert("groceryList", {
      item: args.item,
      quantity: args.quantity,
      department: "default",
      unit: args.unit,
      notes: args.notes,
      priority: args.priority,
      checked: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const departmentList = Object.values(DepartmentConfig);
    ctx.scheduler.runAfter(0, internal.groceryList.categorizeItem, {
      itemId,
      itemName: args.item,
      departments: departmentList.map(d => ({ id: d.id, displayName: d.displayName, description: d.description })),
    });
    return itemId;
  },
});

/**
 * Add a grocery item to the list and also add it to the item definitions table
 * This is a convenience function that combines both operations to build up
 * the autocomplete database while users add items to their grocery list
 */
export const addGroceryItemWithDefinition = mutation({
  args: {
    item: v.string(),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    notes: v.optional(v.string()),
    priority: v.optional(v.number()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"groceryList">> => {
    // First add the item to the grocery list
    const itemId = await ctx.runMutation(api.groceryList.addGroceryItem, {
      item: args.item,
      quantity: args.quantity,
      unit: args.unit,
      notes: args.notes,
      priority: args.priority,
    });

    // Then schedule the normalization and storage process for the item definition
    ctx.scheduler.runAfter(0, internal.groceryItems.normalizeAndStoreItem, {
      originalItem: args.item,
      image: args.image,
    });

    return itemId;
  },
});

// Toggle the checked status of an item
export const toggleItemChecked = mutation({
  args: {
    id: v.id("groceryList"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) {
      throw new Error("Item not found");
    }

    await ctx.db.patch(args.id, {
      checked: !item.checked,
      updatedAt: Date.now(),
    });
  },
});

// Update an existing grocery list item
export const updateItem = mutation({
  args: {
    id: v.id("groceryList"),
    item: v.optional(v.string()),
    department: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    notes: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const existingItem = await ctx.db.get(id);

    if (!existingItem) {
      throw new Error("Item not found");
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
export const deleteItem = mutation({
  args: {
    id: v.id("groceryList"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
// Delete all items from the grocery list
export const deleteAllItems = mutation({
  args: {},
  handler: async ctx => {
    const items = await ctx.db.query("groceryList").collect();

    await Promise.all(items.map(item => ctx.db.delete(item._id)));
  },
});
export const deleteCheckedItems = mutation({
  args: {},
  handler: async ctx => {
    const items = await ctx.db
      .query("groceryList")
      .filter(q => q.eq(q.field("checked"), true))
      .collect();

    await Promise.all(items.map(item => ctx.db.delete(item._id)));
  },
});

// Query to fetch all grocery list items
export const getAllItems = query({
  args: {},
  handler: async ctx => {
    const items = await ctx.db.query("groceryList").collect();

    return items.sort((a, b) => {
      if (a.department !== b.department) {
        return a.department.localeCompare(b.department);
      }
      return a.item.localeCompare(b.item);
    });
  },
});
export const getNumberOfItems = query({
  args: {},
  handler: async ctx => {
    const items = await ctx.db.query("groceryList").collect();

    return items.length;
  },
});
export const getUncheckedItems = query({
  args: {},
  handler: async ctx => {
    const items = await ctx.db
      .query("groceryList")
      .filter(q => q.eq(q.field("checked"), false))
      .collect();

    return items.sort((a, b) => {
      if (a.department !== b.department) {
        return a.department.localeCompare(b.department);
      }
      return a.item.localeCompare(b.item);
    });
  },
});
// gets all the checked items in a single list
export const getCheckedItems = query({
  args: {},
  handler: async ctx => {
    const items = await ctx.db
      .query("groceryList")
      .filter(q => q.eq(q.field("checked"), true))
      .collect();

    return items.sort((a, b) => {
      if (a.department !== b.department) {
        return a.department.localeCompare(b.department);
      }
      return a.item.localeCompare(b.item);
    });
  },
});

export const categorizeItem = internalAction({
  args: {
    itemId: v.id("groceryList"),
    itemName: v.string(),
    departments: v.array(v.object({ id: v.string(), displayName: v.string(), description: v.optional(v.string()) })),
  },
  handler: async (ctx, args) => {
    // call llm to categorize item
    const response: { category: string } = await categorizeItemWithLLM(args.itemName, args.departments);
    // update the item with the category
    await ctx.runMutation(api.groceryList.updateItem, {
      id: args.itemId,
      department: response.category,
    });
  },
});

export const reCategorizeAllItems = internalAction({
  args: {},

  handler: async (ctx, args) => {
    const items = await ctx.runQuery(api.groceryList.getAllItems, {});

    await Promise.all(
      items.map((item: Doc<"groceryList">) =>
        ctx.runAction(internal.groceryList.categorizeItem, {
          itemId: item._id,
          itemName: item.item,
          departments: Object.values(DepartmentConfig),
        }),
      ),
    );
  },
});
