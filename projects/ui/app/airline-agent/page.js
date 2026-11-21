"use client";

import { MessageSquare, Radar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FlightLookup from "./flight-lookup";
import AirlineChat from "./airline-chat";
import "./airline.css";

export default function AirlineAgentPage() {
  return (
    <div className="airline-page">
      <Tabs defaultValue="chat" className="airline-tabs">
        <div className="airline-navigation">
          <TabsList variant="line" aria-label="Airline tools">
            <TabsTrigger value="chat"><MessageSquare aria-hidden="true" />Ask Lisa</TabsTrigger>
            <TabsTrigger value="lookup"><Radar aria-hidden="true" />Flight lookup</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="chat" forceMount>
          <AirlineChat />
        </TabsContent>
        <TabsContent value="lookup" forceMount className="airline-lookup-panel">
          <FlightLookup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
