import { useQuery, useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Button } from "../ui/Button";
import { DepartmentConfig, DepartmentNames, getDepartmentName } from "./GroceryModel";
import "swiper/css";
import { SwipeableGroceryItem } from "./GroceryItem";
import type { GroceryItem as GroceryItemType } from "./GroceryModel";
import { AddItemFAB } from "./AddItemFAB";
import { Skeleton } from "../ui";

export const GroceryList = () => {
  const items = useQuery(api.groceryList.getUncheckedItems);
  const checkedItems = useQuery(api.groceryList.getCheckedItems);
  const [deleting, setDeleting] = useState(false);
  const deleteCheckedItems = useMutation(api.groceryList.deleteCheckedItems);

  // Group items by department
  let itemsByDepartment: Record<DepartmentNames, GroceryItemType[]> =
    items?.reduce(
      (acc, item) => {
        const department = item.department as DepartmentNames;
        if (!acc[department]) {
          acc[department] = [];
        }
        acc[department].push(item);
        return acc;
      },
      {} as Record<DepartmentNames, GroceryItemType[]>,
    ) ?? ({} as Record<DepartmentNames, GroceryItemType[]>);

  // sort items by departments map,  default and unknown on top, otherwise by sortorder if it exists in the department config, else the same order as the department config
  itemsByDepartment = Object.fromEntries(
    Object.entries(itemsByDepartment).sort((a, b) => {
      if (a[0] === "default") return -1;
      if (b[0] === "default") return 1;
      if (a[0] === "unknown") return -1;
      if (b[0] === "unknown") return 1;
      const aSortOrder = DepartmentConfig[a[0] as keyof typeof DepartmentConfig]?.sortOrder;
      const bSortOrder = DepartmentConfig[b[0] as keyof typeof DepartmentConfig]?.sortOrder;
      if (aSortOrder && bSortOrder) {
        return aSortOrder - bSortOrder;
      }
      return 0;
    }),
  );

  // shadow loader before the items load
  if (!items) {
    return (
      <div className="bg-background  pb-16">
        <div className="container mx-auto max-w-2xl p-4">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Grocery List</h1>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-md py-2" />
              <Skeleton className="h-8 w-full rounded-md py-2" />
              <Skeleton className="h-8 w-full rounded-md py-2" />
              <Skeleton className="h-8 w-full rounded-md py-2" />
              <Skeleton className="h-8 w-full rounded-md py-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background  pb-16">
      {/* Main content area */}
      <div className="container mx-auto max-w-2xl p-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Grocery List</h1>
        </div>

        {/* List items grouped by department */}
        <div className="space-y-3">
          {Object.keys(itemsByDepartment ?? {}).map((department, index) => {
            const items = itemsByDepartment[department];
            if (!items?.length) return null;

            return (
              <section key={department}>
                {department !== "default" && <h2 className="mb-2 text-lg font-semibold text-muted-foreground">{getDepartmentName(department)}</h2>}
                <div className="space-y-1">
                  {items.map((item: GroceryItemType) => (
                    <SwipeableGroceryItem key={item._id} item={item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
        {checkedItems && checkedItems.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 flex flex-row justify-between text-lg font-semibold text-muted-foreground">
              Archived Items{" "}
              <span
                className="cursor-pointer pl-1"
                onClick={async () => {
                  setDeleting(true);
                  await deleteCheckedItems();
                  setDeleting(false);
                }}
              >
                <Trash2 className={deleting ? "animate-spin" : ""} />
              </span>
            </h2>
            <div className="space-y-1">{checkedItems?.map((item: GroceryItemType) => <SwipeableGroceryItem key={item._id} item={item} archiveList />)}</div>
          </div>
        )}
      </div>

      <AddItemFAB />

      {/* Bottom Toolbar */}
      <BottomToolbar />
    </div>
  );
};

const BottomToolbar = () => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const deleteAllItems = useMutation(api.groceryList.deleteAllItems);
  const numItems = useQuery(api.groceryList.getNumberOfItems);
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 flex items-center justify-between border-t
                        border-border bg-background px-4 py-3"
    >
      <Button
        variant="destructive"
        size="sm"
        disabled={isDeleteLoading}
        className="flex items-center gap-2"
        onClick={async () => {
          setIsDeleteLoading(true);
          await deleteAllItems();
          setIsDeleteLoading(false);
        }}
      >
        <Trash2 className="h-4 w-4" />
        Clear All
      </Button>
      <span className="text-sm text-muted-foreground">{numItems ?? 0} items</span>
    </div>
  );
};
