"use client";

import { useState } from "react";
import { ArrowRight, ArrowRightLeft, CalendarDays, Plane, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorNotice, ResponseStatus } from "@/components/studio-ui";
import { airlineRequest, requestError } from "./api";

function today() {
  const local = new Date();
  return [
    local.getFullYear(),
    String(local.getMonth() + 1).padStart(2, "0"),
    String(local.getDate()).padStart(2, "0"),
  ].join("-");
}

function FlightTime({ airport, date }) {
  const [label, value] = [
    ["Actual", airport.actual],
    ["Estimated", airport.estimated],
    ["Scheduled", airport.scheduled],
  ].find(([, value]) => value) || [];
  const utc = value ? new Date(value) : null;
  const iso = utc && !Number.isNaN(utc.valueOf()) ? utc.toISOString() : "";

  return (
    <div className="airline-airport">
      <strong>{airport.iata || "—"}</strong>
      <span title={airport.airport || undefined}>{airport.airport || "Airport unavailable"}</span>
      {iso ? (
        <time dateTime={iso}>
          {label} {iso.slice(11, 16)} UTC
          {iso.slice(0, 10) !== date && <small>{iso.slice(0, 10)}</small>}
        </time>
      ) : <small>Time unavailable</small>}
    </div>
  );
}

function FlightRecord({ flight }) {
  const status = flight.status?.replaceAll("_", " ") || "Unknown status";
  const delays = [
    flight.departure.delay > 0 && `Departure +${flight.departure.delay} min`,
    flight.arrival.delay > 0 && `Arrival +${flight.arrival.delay} min`,
  ].filter(Boolean);

  return (
    <li className="airline-record">
      <div className="airline-record-heading">
        <div>
          <strong>{flight.flight_number || flight.flight_icao || "Flight number unavailable"}</strong>
          {flight.airline && <p>{flight.airline}</p>}
        </div>
        <Badge variant="secondary" className="capitalize">{status}</Badge>
      </div>
      <div className="airline-flight-path">
        <FlightTime airport={flight.departure} date={flight.flight_date} />
        <div aria-hidden="true" className="airline-path-line"><ArrowRight /></div>
        <FlightTime airport={flight.arrival} date={flight.flight_date} />
      </div>
      {delays.length > 0 && <p className="airline-delay">{delays.join(" · ")}</p>}
    </li>
  );
}

export default function FlightLookup() {
  const [mode, setMode] = useState("route");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const byRoute = mode === "route";

  function selectMode(value) {
    setMode(value);
    setResult(null);
    setError("");
  }

  async function lookup(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setResult(null);
    setError("");
    const path = byRoute ? "/flights/search" : "/flights/status";
    const body = byRoute
      ? { origin: origin.trim(), destination: destination.trim() || null, departure_date: date }
      : { flight_number: number.trim(), flight_date: date };
    try {
      const response = await airlineRequest(path, { body, signal: AbortSignal.timeout(90000) });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const routeLabel = body.destination ? `${body.origin} to ${body.destination}` : `Departures from ${body.origin}`;
      setResult({
        ...data,
        label: byRoute ? routeLabel : body.flight_number.toUpperCase(),
        date,
      });
    } catch (error) {
      setError(requestError(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="airline-lookup">
      <form className="airline-surface airline-search-form" onSubmit={lookup}>
        <div className="airline-search-head">
          <h3>Find a flight</h3>
          <div className="airline-mode" role="group" aria-label="Search by">
            {[["route", "Route / departures"], ["number", "Flight number"]].map(([value, label]) => (
              <Button key={value} size="sm" type="button" variant={mode === value ? "secondary" : "ghost"}
                aria-pressed={mode === value} disabled={pending} onClick={() => selectMode(value)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className={`airline-fields ${byRoute ? "is-route" : ""}`}>
          {byRoute ? (
            <div className="airline-route-fields">
              <div className="airline-field">
                <Label htmlFor="airline-origin">From</Label>
                <Input id="airline-origin" placeholder="City or airport code" required maxLength={100}
                  value={origin} onChange={(event) => setOrigin(event.target.value)} />
              </div>
              <Button className="airline-swap" type="button" variant="outline" size="icon-lg"
                title="Swap airports" aria-label="Swap airports" disabled={!destination.trim()} onClick={() => {
                  setOrigin(destination);
                  setDestination(origin);
                }}>
                <ArrowRightLeft aria-hidden="true" />
              </Button>
              <div className="airline-field">
                <Label htmlFor="airline-destination">To (optional)</Label>
                <Input id="airline-destination" placeholder="Any destination" maxLength={100}
                  value={destination} onChange={(event) => setDestination(event.target.value)} />
              </div>
            </div>
          ) : (
            <div className="airline-field">
              <Label htmlFor="airline-number">Flight number</Label>
              <Input id="airline-number" placeholder="e.g. AA1" required maxLength={12}
                value={number} onChange={(event) => setNumber(event.target.value)} />
            </div>
          )}
          <div className="airline-field">
            <div className="airline-date-label">
              <Label htmlFor="airline-date">Departure date</Label>
              <button type="button" onClick={() => setDate(today())}>Today</button>
            </div>
            <Input id="airline-date" type="date" required value={date}
              onChange={(event) => setDate(event.target.value)} />
          </div>
          <Button type="submit" size="lg" disabled={pending}>
            <Search aria-hidden="true" /> Search
          </Button>
        </div>
        <p className="airline-hint">Aviationstack provides recent flight records. Fares and future schedules are unavailable.</p>
      </form>

      {error && <ErrorNotice title="Flight lookup failed">{error}</ErrorNotice>}
      {pending && <ResponseStatus active>Checking Aviationstack…</ResponseStatus>}
      {result && (
        <section className="airline-results" aria-labelledby="airline-results-title" aria-live="polite">
          <div className="airline-results-head">
            <h3 id="airline-results-title">{result.label}</h3>
            <span><CalendarDays aria-hidden="true" />{result.date} · {result.flights.length} {result.flights.length === 1 ? "record" : "records"}</span>
          </div>
          {result.truncated && <p className="airline-hint">More records may be available beyond the results checked.</p>}
          {result.flights.length ? (
            <ul className="airline-flight-list">
              {result.flights.map((flight, index) => (
                <FlightRecord key={`${flight.flight_number}-${flight.departure.scheduled}-${index}`} flight={flight} />
              ))}
            </ul>
          ) : (
            <div className="airline-surface airline-empty">
              <Plane aria-hidden="true" />
              <strong>No matching flight records</strong>
              <p>{result.notice}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
