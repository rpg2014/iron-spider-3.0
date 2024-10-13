import { Meta, StoryObj } from "@storybook/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "ui/Select",
  component: Select,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    //   variant: { control: "select", options: ["default", "destructive", "outline", "secondary", "ghost", "link"] },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;
const connectedUsers = [
  { displayName: "User 1", userId: "1" },
  { displayName: "User 2", userId: "2" },
  { displayName: "User 3", userId: "XX3XXX" },
];
export const UserSelect: Story = {
  render: args => {
    return (
      <Select defaultValue={connectedUsers[0]?.displayName || "Error"} name="dateThrower">
        <SelectTrigger>
          <SelectValue defaultValue={connectedUsers[0]?.displayName || "Error"} placeholder="Who threw the date?" />
        </SelectTrigger>
        <SelectContent>
          {connectedUsers.length > 0 &&
            connectedUsers.map(user => (
              <SelectItem className="cursor-pointer" value={user.displayName || user.userId || "Error"}>
                {user.displayName}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    );
  },
};
