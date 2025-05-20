import { useMutation } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { Virtual } from "swiper/modules";
import { SwiperSlide, Swiper } from "swiper/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { Card, CardContent, Checkbox } from "../ui";
import type { GroceryItem as GroceryItemType } from "./GroceryModel";
import { RefreshCcw } from "lucide-react";

export const GroceryItem = ({ item, archiveList }: { item: GroceryItemType; archiveList?: boolean }) => {
  const toggleItemChecked = useMutation(api.groceryList.toggleItemChecked);
  const [checked, setChecked] = useState(item.checked);
  const [strikethrough, setStrikethrough] = useState(item.checked);
  const [loading, setLoading] = useState(false);

  const handleCheckChange = () => {
    setLoading(true);
    setStrikethrough(!strikethrough);
    setTimeout(async () => {
      // uncomment to make it fade away before it's removed from the list,
      // setChecked(!checked)
      await toggleItemChecked({ id: item._id as Id<"groceryList"> });
      setLoading(false);
    }, 0);
  };
  return (
    <Card key={item._id} className={checked && !archiveList ? "animate-fade-out" : "animate-fade-in"}>
      <CardContent className="flex items-center gap-3 px-3 py-2">
        <Checkbox
          checked={strikethrough}
          // We'll implement this handler later
          onCheckedChange={handleCheckChange}
        />
        <div className="flex-1">
          <h3 className={`flex flex-row items-center justify-start font-medium ${strikethrough ? "line-through" : ""}`}>
            {item.item}
            {loading && <RefreshCcw size={16} className="ml-2 animate-spin" />}
          </h3>
          {item.notes && <p className={`text-xs text-muted-foreground ${strikethrough ? "line-through" : ""}`}>{item.notes}</p>}
        </div>
        {item.quantity && (
          <div className={`text-sm text-muted-foreground ${strikethrough ? "line-through" : ""}`}>
            {item.quantity} {item.unit}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
// Separate component for the swipeable item
export const SwipeableGroceryItem = ({ item, archiveList }: { item: GroceryItemType; archiveList?: boolean }) => {
  const toggleItemChecked = useMutation(api.groceryList.toggleItemChecked);
  const [loading, setLoading] = useState(false);
  const swiperRef = useRef<any>(null);

  const handleSwipe = () => {
    toggleItemChecked({ id: item._id as Id<"groceryList"> });

    // Reset swiper position after a short delay

    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideTo(0, 300);
    }
  };

  return (
    <Swiper
      ref={swiperRef}
      modules={[Virtual]}
      virtual
      spaceBetween={0}
      slidesPerView={1}
      initialSlide={1}
      threshold={20}
      resistanceRatio={0.85}
      className="mb-2"
      // Ensure slides are the same height
      // style={{ height: '100%' }}
      // // autoHeight={true}
      allowSlidePrev={true}
      allowSlideNext={true}
      touchRatio={1}
      touchAngle={45}
      onSlideChangeTransitionEnd={swiper => {
        //   if (slideOffset !== 1) {
        if (swiper.activeIndex !== 1) {
          handleSwipe();
        }
      }}
    >
      {/* Only show the action slide when swiping, not in the default view */}
      <SwiperSlide style={{ height: "2rem" }}>
        <div className={`flex  min-h-full items-center justify-center`}>
          <span className={``}></span>
        </div>
      </SwiperSlide>
      <SwiperSlide>
        <GroceryItem item={item} archiveList={archiveList} />
      </SwiperSlide>

      {/* Only show the action slide when swiping, not in the default view */}
      <SwiperSlide style={{ height: "2rem" }}>
        <div className={`flex min-h-full items-center justify-center`}>
          <span className={``}></span>
        </div>
      </SwiperSlide>
    </Swiper>
  );
};
