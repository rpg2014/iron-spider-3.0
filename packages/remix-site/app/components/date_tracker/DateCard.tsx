import React, { useState } from "react";
import type { DateInfo } from "iron-spider-client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import styles from "./DateCard.module.css";
import { Skeleton } from "../ui/Skeleton";
import { Link } from "@remix-run/react";
import { BookHeartIcon, Calendar, CalendarIcon, MapPin, MapPinIcon, UserRoundIcon } from "lucide-react";

interface DateCardProps {
  date: DateInfo;
  onClickNav?: boolean;
}

const ICON_SIZE = "15";

const DateCard: React.FC<DateCardProps> = ({ date, onClickNav = false }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!date) {
    return <div>Loading...</div>;
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Date not specified";
    // Date typecheck, create date from it if not, its a UTC epoch seconds value
    // console.log(`Recieved date: ${date}`);
    if (typeof date === "number") date = new Date(date * 1000);
    // if date isn't a date, make it one.  date is an ISO string here
    if (!(date instanceof Date)) date = new Date(date);

    // console.log(`converted? date unix time: ${date.toISOString()}`);

    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const RenderedCard = () => (
    <Card className={`${styles.cardContainer} shadow-lg transition-all duration-300 hover:shadow-xl`}>
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl font-bold">{date.title}</CardTitle>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <MapPinIcon size={ICON_SIZE} className="h-4 w-4 flex-shrink-0 text-gray-400" />
            {/* <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg> */}
            <p className="text-sm text-gray-300">{date.location}</p>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarIcon size={ICON_SIZE} className="h-4 w-4 flex-shrink-0 text-gray-400" />
            {/* <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg> */}
            <p className="text-sm text-gray-300">{formatDate(date.date)}</p>
          </div>
          {date.dateThrower && (
            <div className="flex items-center space-x-2">
              <UserRoundIcon size={ICON_SIZE} className="h-4 w-4 flex-shrink-0 text-gray-400" />
              {/* <svg className="" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg> */}
              <p className="text-sm text-gray-300">Planned by: {date.dateThrower}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {date.pictureId && (
          <div className="relative">
            {!imgLoaded && <Skeleton className="aspect-square h-auto w-full rounded" />}
            <img
              src={date.pictureId}
              alt={`Date at ${date.location}`}
              onLoad={() => setImgLoaded(true)}
              style={{ height: !imgLoaded ? "0px" : undefined }}
              className={`h-auto w-full rounded object-cover ${imgLoaded ? "" : "hidden"}`}
            />
          </div>
        )}
        {date.note && (
          <div className="flex items-start space-x-2">
            <BookHeartIcon size={ICON_SIZE} className="mt-1 h-4 w-4 flex-shrink-0 text-gray-400" />
            {/* <svg className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg> */}
            <p className="text-sm text-gray-300">{date.note}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      {onClickNav ? (
        <Link prefetch="viewport" to={`/dates/${date.id}`} className="block cursor-pointer">
          <RenderedCard />
        </Link>
      ) : (
        <RenderedCard />
      )}
    </>
  );
};

export default DateCard;
