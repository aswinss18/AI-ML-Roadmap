"use client";

import { MessageSquare, Plane, Radar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FlightLookup from "./flight-lookup";
import AirlineChat from "./airline-chat";
import "./airline.css";

export default function AirlineAgentPage() {
  return (
    <div className="airline-page">
      <section className="airline-intro" aria-labelledby="airline-title">
        <div className="airline-intro-icon"><Plane aria-hidden="true" /></div>
        <div>
          <h2 id="airline-title">Flight desk</h2>
          <p>Track a flight by route or number, or ask Lisa for help.</p>
        </div>
      </section>

      <Tabs defaultValue="lookup" className="airline-tabs">
        <TabsList variant="line" aria-label="Airline tools">
          <TabsTrigger value="lookup"><Radar aria-hidden="true" />Flight lookup</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare aria-hidden="true" />Ask Lisa</TabsTrigger>
        </TabsList>
        <TabsContent value="lookup" forceMount>
          <FlightLookup />
        </TabsContent>
        <TabsContent value="chat" forceMount>
          <AirlineChat />
        </TabsContent>
      </Tabs>
    </div>
  );
}
