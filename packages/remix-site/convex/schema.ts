import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Note on future extensibility:
// To support multiple grocery lists in the future:
// 1. Add a listId field to groceryList table
// 2. Create a new lists table with metadata like name, owner, sharing settings
// 3. Add userId field for ownership/access control
// 4. Consider adding indexes on listId and userId

export default defineSchema({
  groceryList: defineTable({
    // The name of the grocery item
    item: v.string(),
    // Optional department/category for better organization
    department: v.string(),
    // Whether the item has been checked off
    checked: v.boolean(),
    // Quantity of the item needed
    quantity: v.optional(v.number()),
    // Optional unit (e.g., "lbs", "pieces", "boxes")
    unit: v.optional(v.string()),
    // Notes about the item (e.g., "get the red ones")
    notes: v.optional(v.string()),
    // Priority level (1 = highest priority)
    priority: v.optional(v.number()),
    // When the item was added
    createdAt: v.number(),
    // When the item was last modified
    updatedAt: v.number(),
  })
    .index("by_department", ["department"])
    .index("by_checked", ["checked"]),
  itemDefinitions: defineTable({
    // The name of the grocery item
    item: v.string(),
    // Optional Image
    image: v.optional(v.string()),
  }).searchIndex("search_item", {
    searchField: "item",
    filterFields: ["item"],
  }),
});
