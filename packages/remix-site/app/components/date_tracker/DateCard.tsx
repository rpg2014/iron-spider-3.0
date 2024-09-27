import React, { useState } from "react";
import type { DateInfo } from "iron-spider-client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import styles from "./DateCard.module.css";
import { Skeleton } from "../ui/Skeleton";

interface DateCardProps {
  date: DateInfo;
}

/**
 * Todo, add support for skeleton showing until the image is loaded in.
 * @param param0
 * @returns
 */
const DateCard: React.FC<DateCardProps> = ({ date }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  if (!date) {
    return <div>Loading...</div>;
  }
  return (
    <Card className={styles.cardContainer}>
      <CardHeader>
        <CardTitle>{date.location}</CardTitle>
      </CardHeader>
      <CardContent>
        {!imgLoaded && <Skeleton className="w-full h-auto aspect-square mb-4 rounded" />}
        <img
          src={date.pictureId}
          alt={`Date at ${date.location}`}
          onLoad={() => setImgLoaded(true)}
          // width="200px"
          // width full on small devices, but just fill space otherwise
          style={{ height: !imgLoaded ? "0px" : undefined }}
          className={`w-full h-auto  rounded ${imgLoaded ? "mb-4" : ""}`}
        />
        {date.note && <p className="text-sm text-gray-600">{date.note}</p>}
      </CardContent>
    </Card>
  );
};

export default DateCard;
