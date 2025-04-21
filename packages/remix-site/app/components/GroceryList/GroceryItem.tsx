import { useMutation } from "convex/react";
import { useState, useEffect, useRef } from "react";
import { Virtual } from "swiper/modules";
import { SwiperSlide, Swiper } from "swiper/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { Card, CardContent, Checkbox } from "../ui";
import type { GroceryItem as GroceryItemType } from "./GroceryModel";

export const GroceryItem = ({ item, archiveList }: { item: GroceryItemType; archiveList?: boolean }) => {
  const toggleItemChecked = useMutation(api.groceryList.toggleItemChecked);
  const checked = item.checked;
  // const [checked, setChecked] = useState(item.checked);
  //   // Update checked state when item changes
  //   useEffect(() => {
  //     setChecked(item.checked);
  //   }, [item.checked]);
  const handleCheckChange = () => {
    toggleItemChecked({ id: item._id as Id<"groceryList"> });
    // setChecked(!checked);
  };
  return (
    <Card key={item._id} className={checked && !archiveList ? "animate-fade-out" : "animate-fade-in"}>
      <CardContent className="flex items-center gap-3 px-3 py-2">
        <Checkbox
          checked={item.checked}
          // We'll implement this handler later
          onCheckedChange={handleCheckChange}
        />
        <div className="flex-1">
          <h3 className={`font-medium ${item.checked ? "line-through" : ""}`}>{item.item}</h3>
          {item.notes && <p className={`text-xs text-muted-foreground ${item.checked ? "line-through" : ""}`}>{item.notes}</p>}
        </div>
        {item.quantity && (
          <div className={`text-sm text-muted-foreground ${item.checked ? "line-through" : ""}`}>
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
