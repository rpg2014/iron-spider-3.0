import { Plus, ListPlus, PlusCircle } from "lucide-react";
import { useState, Suspense } from "react";
import { Button } from "../ui";
import { AddItemDrawer } from "./AddItemDrawer";
import { Link } from "react-router";

export const AddItemFAB = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    setIsExpanded(false);
  };

  return (
    <>
      {/* Add Item Drawer with Suspense */}
      <Suspense fallback={<></>}>
        <div className="fixed bottom-20 right-4 z-10">
          {/* Main FAB Button */}
          <Button onClick={toggleExpand} className="h-14 w-14 animate-slide-in rounded-full shadow-lg" size="icon">
            <Plus className={`h-6 w-6 transition-transform duration-300 ${isExpanded ? "rotate-45" : ""}`} />
            <span className="sr-only">Add item options</span>
          </Button>

          {/* Floating buttons container */}
          <div className="absolute bottom-16 right-0 mb-4 flex flex-col items-end space-y-6">
            {/* Full Form Button */}
            <div className={`flex items-center transition-all duration-300 ${isExpanded ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}>
              <div className="mr-2 flex items-center">
                <span className="whitespace-nowrap rounded-md bg-white px-4 py-2 text-sm shadow-md dark:bg-gray-800">Full Form</span>
              </div>
              <Button asChild className="h-12 w-12 rounded-full shadow-lg" size="icon">
                <Link to="/grocery-list/add-item">
                  <ListPlus className="h-5 w-5" />
                  <span className="sr-only">Go to add item form</span>
                </Link>
              </Button>
            </div>

            {/* Quick Add Button */}
            <div className={`flex items-center transition-all duration-300 ${isExpanded ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"}`}>
              <div className="mr-2 flex items-center">
                <span className="whitespace-nowrap rounded-md bg-white px-4 py-2 text-sm shadow-md dark:bg-gray-800">Quick Add</span>
              </div>
              <Button onClick={openDrawer} className="h-12 w-12 rounded-full shadow-lg" size="icon">
                <PlusCircle className="h-5 w-5" />
                <span className="sr-only">Quick add item</span>
              </Button>
            </div>
            {/* TODO, add bulk item fab + page, that uses an llm to take in a recipe list, then creates all the grocery items.  */}
          </div>
        </div>

        <AddItemDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
      </Suspense>
    </>
  );
};
