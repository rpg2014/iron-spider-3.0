export interface GroceryDepartment {
  id: string;
  displayName: string;
  description?: string;
  sortOrder?: number;
}
export interface GroceryItem {
  _id: string;
  item: string;
  department?: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
  notes?: string;
}
// Department display names
export const getDepartmentName = (department: string) => DepartmentConfig[department as keyof typeof DepartmentConfig]?.displayName ?? "";
export type DepartmentKeys =
  | "PRODUCE"
  | "DAIRY_AND_EGGS"
  | "MEAT_AND_SEAFOOD"
  | "BAKERY"
  | "DELI"
  | "FROZEN_FOODS"
  | "CANNED_GOODS"
  | "DRY_GOODS"
  | "SNACKS"
  | "BEVERAGES"
  | "CONDIMENTS"
  | "BAKING_SUPPLIES"
  | "BREAKFAST_FOODS"
  | "INTERNATIONAL_FOODS"
  | "HEALTH_AND_BEAUTY"
  | "HOUSEHOLD_ITEMS"
  | "ALCOHOL"
  | "SPICES_AND_HERBS"
  | "SLICED_BREAD"
  | "UPSTAIRS";
export type DepartmentNames = DepartmentKeys | string;
export const DepartmentConfig: Record<DepartmentKeys, GroceryDepartment> = {
  PRODUCE: {
    id: "PRODUCE",
    displayName: "Produce",
    description: "Fresh fruits and vegetables, like apples, lettuce, and carrots.",
  },
  DAIRY_AND_EGGS: {
    id: "DAIRY_AND_EGGS",
    displayName: "Dairy and Eggs",
    description: "Dairy products and eggs, including milk, cheese, and yogurt.",
  },
  MEAT_AND_SEAFOOD: {
    id: "MEAT_AND_SEAFOOD",
    displayName: "Meat and Seafood",
    description: "Fresh and frozen meats like chicken, beef, and fish.",
  },
  BAKERY: {
    id: "BAKERY",
    displayName: "Bakery",
    description: "Fresh baked goods such as cakes, muffins, and pastries.",
  },
  DELI: {
    id: "DELI",
    displayName: "Deli",
    description: "Prepared meats, cheeses, and salads like ham, turkey, and coleslaw.",
  },
  FROZEN_FOODS: {
    id: "FROZEN_FOODS",
    displayName: "Frozen Foods",
    description: "Frozen meals, vegetables, and desserts like pizza, peas, and ice cream.",
  },
  CANNED_GOODS: {
    id: "CANNED_GOODS",
    displayName: "Canned Goods",
    description: "Preserved foods in cans including soups, vegetables, and fruits.",
  },
  DRY_GOODS: {
    id: "DRY_GOODS",
    displayName: "Dry Goods/Pantry Items",
    description: "Shelf-stable items like pasta, rice, and cereal.",
  },
  SNACKS: {
    id: "SNACKS",
    displayName: "Snacks",
    description: "Ready-to-eat treats like chips, crackers, and nuts.",
  },
  BEVERAGES: {
    id: "BEVERAGES",
    displayName: "Beverages",
    description: "Drinks including soda, juice, and water.",
  },
  CONDIMENTS: {
    id: "CONDIMENTS",
    displayName: "Condiments and Sauces",
    description: "Flavor enhancers like ketchup, mustard, and mayonnaise.",
  },
  BAKING_SUPPLIES: {
    id: "BAKING_SUPPLIES",
    displayName: "Baking Supplies",
    description: "Ingredients for baking such as flour, sugar, and baking powder.",
  },
  BREAKFAST_FOODS: {
    id: "BREAKFAST_FOODS",
    displayName: "Breakfast Foods",
    description: "Morning meal items like cereal, oatmeal, and pancake mix.",
  },
  INTERNATIONAL_FOODS: {
    id: "INTERNATIONAL_FOODS",
    displayName: "International/Ethnic Foods",
    description: "Foods from various cultures like pasta, curry sauces, and tortillas.",
  },
  // HEALTH_AND_BEAUTY: {
  //   id: "HEALTH_AND_BEAUTY",
  //   displayName: "Health and Beauty",
  //   description: "Personal care items such as soap, shampoo, and toothpaste.",
  // },
  HOUSEHOLD_ITEMS: {
    id: "HOUSEHOLD_ITEMS",
    displayName: "Household Items",
    description: "Home essentials like light bulbs, batteries, and kitchen tools.",
  },
  ALCOHOL: {
    id: "ALCOHOL",
    displayName: "Alcohol",
    description: "Alcoholic beverages like beer, wine, and spirits.",
  },
  SPICES_AND_HERBS: {
    id: "SPICES_AND_HERBS",
    displayName: "Spices and Herbs",
    description: "Seasonings including salt, pepper, and dried herbs.",
  },
  SLICED_BREAD: {
    id: "SLICED_BREAD",
    displayName: "Sliced Bread",
    description: "Various types of sliced bread like white, wheat, and sourdough.",
  },
  UPSTAIRS: {
    id: "UPSTAIRS",
    displayName: "Upstairs",
    description: "Home goods, cleaning and paper products like detergent, paper towels, and toilet paper. Includes Pet supplies as well as soap, and other health and Beauty items.",
  },
};
