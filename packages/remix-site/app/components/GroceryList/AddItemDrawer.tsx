import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "~/components/ui/Drawer.client";
import { Input, Button, Select, Label, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui";

interface AddItemDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddItemDrawer = ({ open, onOpenChange }: AddItemDrawerProps) => {
  const addItem = useMutation(api.groceryList.addGroceryItemWithDefinition);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Add Item</DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="item">Item Name</Label>
            <Input id="item" placeholder="Enter item name" autoFocus value={itemName} onChange={e => setItemName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex gap-2">
              <Input id="quantity" type="number" placeholder="Amount" className="flex-1" value={quantity} onChange={e => setQuantity(e.target.value)} />
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="" />
                </SelectTrigger>
                <SelectContent>
                  {/* todo extract to list */}
                  <SelectItem value="units">units</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="kg">oz</SelectItem>
                  <SelectItem value="thingiys">thingiys</SelectItem>
                  <SelectItem value="cans">can(s)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input id="notes" placeholder="Add any special instructions" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DrawerFooter>
          <Button
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await addItem({
                item: itemName,
                quantity: quantity ? Number(quantity) : undefined,
                unit: unit,
                notes: notes,
              });
              setLoading(false);
              onOpenChange(false);
              setItemName("");
              setQuantity("");
              setUnit("");
              setNotes("");
            }}
          >
            {!loading ? "Add to List" : "Saving..."}
          </Button>
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
