import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ClientActionFunctionArgs, Form, useNavigate, useNavigation } from "react-router";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { data } from "react-router";
import { Route } from "./+types/grocery-list.add-item";
import { CONVEX_DEPLOYMENT_URL } from "~/components/GroceryList/constants";
import { ConvexHttpClient } from "convex/browser";
import { GroceryItem } from "~/components/GroceryList/GroceryModel";
import { Check, Loader2, X } from "lucide-react";

const client = new ConvexHttpClient(CONVEX_DEPLOYMENT_URL);
// Client action for adding a grocery item
export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const item = formData.get("item") as string;
  const quantity = formData.get("quantity") ? Number(formData.get("quantity")) : undefined;
  const unit = (formData.get("unit") as string) || undefined;
  const notes = (formData.get("notes") as string) || undefined;

  // Validation
  if (!item) {
    return data({ success: false, error: "Item name and quantity are required" }, { status: 400 });
  }
  try {
    const result = await client.mutation(api.groceryList.addGroceryItemWithDefinition, {
      item,
      quantity,
      unit,
      notes,
    });

    return { success: true, item: { itemName: item, id: result } };
  } catch (error) {
    console.error("Error adding grocery item:", error);
    return data({ success: false, error: "Failed to add grocery item" }, { status: 500 });
  }
}

const AddItem = ({ actionData }: Route.ComponentProps) => {
  const navigate = useNavigate();
  const deleteItem = useMutation(api.groceryList.deleteItem);
  const [deleting, setDeleting] = useState(false);

  // State for form fields
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const { state } = useNavigation();
  const loading = state === "submitting";
  const [itemsAdded, setItemsAdded] = useState<{ itemName: string; id: string }[]>([]);
  // State for autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionResults = useQuery(api.groceryItems.searchItems, searchQuery.length > 0 ? { query: searchQuery, limit: 5 } : { query: "", limit: 5 });
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //add created items to list
  useEffect(() => {
    console.log("actionData", actionData);
    if (actionData?.success == true) {
      setItemsAdded([...itemsAdded, actionData.item]);
      // clear fields
      setItemName("");
      setQuantity("");
      setUnit(undefined);
      setNotes("");
      setShowSuggestions(false);
      setSearchQuery("");
    }
  }, [actionData]);

  // Handle selecting a suggestion
  const handleSelectSuggestion = (item: Doc<"itemDefinitions">) => {
    setItemName(
      item.item
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    );
    setShowSuggestions(false);
  };

  return (
    <div className="container mx-auto max-w-md p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Add Grocery Item</h1>
        <Button variant="outline" onClick={() => navigate("/grocery-list")}>
          Cancel
        </Button>
      </div>

      <Form method="post" onSubmit={() => {}} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="item">Item Name</Label>
          <div className="relative">
            <Input
              id="item"
              name="item"
              autoFocus
              placeholder="Enter item name"
              value={itemName}
              onChange={e => {
                setItemName(e.target.value);
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              autoComplete="off"
            />

            {/* Autocomplete suggestions */}
            {showSuggestions && searchQuery.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 mt-1 w-full rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
              >
                {suggestionResults?.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">No suggestions found</div>
                ) : (
                  <ul>
                    {suggestionResults?.map(item => (
                      <li
                        key={item._id}
                        className="cursor-pointer p-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleSelectSuggestion(item)}
                      >
                        {/* split by -, then capitilze each word, */}
                        {item.item
                          .split("-")
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <div className="flex gap-2">
            <Input
              id="quantity"
              name="quantity"
              type="number"
              placeholder="Amount"
              className="flex-1"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
            />
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="units">units</SelectItem>
                <SelectItem value="lbs">lbs</SelectItem>
                <SelectItem value="oz">oz</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="g">g</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="unit" value={unit || ""} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Input id="notes" name="notes" placeholder="Add any special instructions" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={loading || !itemName}>
            {loading ? "Adding..." : "Add to Grocery List"}
          </Button>
        </div>
      </Form>
      {/* TODO: show items added in this session in a list below */}
      {itemsAdded && itemsAdded.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-xl font-bold">Items Added</h2>
          <ul className="list-none pl-5">
            {itemsAdded.map(item => (
              <li key={item.id} className="group relative flex flex-row items-center justify-start gap-2 text-center">
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                ) : (
                  <>
                    <Check className="h-4 w-4 text-green-500 group-hover:hidden" />
                    <X
                      className="hidden h-4 w-4 cursor-pointer text-red-500 group-hover:block"
                      onClick={async () => {
                        setDeleting(true);
                        await deleteItem({ id: item.id as Id<"groceryList"> });
                        setDeleting(false);
                        setItemsAdded(itemsAdded.filter(i => i.id !== item.id));
                      }}
                    />
                  </>
                )}
                <span>{item.itemName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddItem;
