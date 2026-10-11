"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TiffinRequest = {
  id: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  selected_dates: string[];
  created_at: string;
  updated_at: string;
} | null;

type SharedPerson = {
  name: string;
  selectedDates: string[];
  isCurrentUser?: boolean;
};

const PLANNING_DAYS = 90;
const TIFFIN_PRICE = 50;
const MEMBERS_PER_PAGE = 5;
const DATES_PER_PAGE = 7;

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function makePlanningDates() {
  const today = startOfToday();
  return Array.from({ length: PLANNING_DAYS }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index + 1);
    return date;
  });
}

function mondayOf(date: Date) {
  const monday = new Date(date);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return monday;
}

function statusCopy(status: NonNullable<TiffinRequest>["status"]) {
  return {
    pending: {
      label: "Request under review",
      text: "Your access request is waiting for approval.",
    },
    rejected: {
      label: "Request not approved",
      text: "Please contact the PG manager if you need to discuss access.",
    },
    suspended: {
      label: "Access paused",
      text: "Your tiffin access is currently paused by the PG manager.",
    },
    approved: {
      label: "Tiffin access approved",
      text: "Choose the future days you want tiffin delivered.",
    },
  }[status];
}

function PaginationControls({
  page,
  totalPages,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 pt-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={page === 0}
        aria-label="Previous page"
      >
        <ChevronLeft />
        Previous
      </Button>
      <span className="text-xs font-medium text-slate-500">
        Page {page + 1} of {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={page === totalPages - 1}
        aria-label="Next page"
      >
        Next
        <ChevronRight />
      </Button>
    </div>
  );
}

export function TiffinDaySelector({
  initialRequest,
  sharedPeople,
}: {
  initialRequest: TiffinRequest;
  sharedPeople: SharedPerson[];
}) {
  const [request, setRequest] = useState(initialRequest);
  const [selectedDates, setSelectedDates] = useState(
    () => new Set(initialRequest?.selected_dates || []),
  );
  const [monthOffset, setMonthOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [showPastData, setShowPastData] = useState(false);
  const [memberPage, setMemberPage] = useState(0);
  const [datePage, setDatePage] = useState(0);
  const planningDates = useMemo(makePlanningDates, []);
  const canEdit = request?.status === "approved";
  const currentSharedPeople = useMemo(
    () =>
      sharedPeople.map((person) =>
        person.isCurrentUser
          ? { ...person, selectedDates: [...selectedDates] }
          : person,
      ),
    [selectedDates, sharedPeople],
  );
  const monthDate =
    planningDates[Math.min(monthOffset * 30, planningDates.length - 1)];
  const sharedNamesByDate = useMemo(() => {
    return currentSharedPeople.reduce<Record<string, string[]>>(
      (names, person) => {
        for (const date of person.selectedDates) {
          names[date] = [...(names[date] || []), person.name];
        }
        return names;
      },
      {},
    );
  }, [currentSharedPeople]);
  const pastDates = useMemo(
    () =>
      Object.keys(sharedNamesByDate)
        .filter((date) => date < localDateKey(startOfToday()))
        .sort((firstDate, secondDate) => secondDate.localeCompare(firstDate)),
    [sharedNamesByDate],
  );
  const residentRows = useMemo(() => {
    const futureRows = planningDates
      .map((date) => localDateKey(date))
      .filter((date) => sharedNamesByDate[date]);
    const dates = showPastData
      ? [...new Set([...pastDates, ...futureRows])].sort()
      : futureRows;
    return dates.map((date) => ({ date, names: sharedNamesByDate[date] }));
  }, [pastDates, planningDates, sharedNamesByDate, showPastData]);
  const weeklyPeriods = useMemo(() => {
    const currentMonday = mondayOf(startOfToday());
    return [-1, 0, 1].map((weekOffset) => {
      const monday = new Date(currentMonday);
      monday.setDate(currentMonday.getDate() + weekOffset * 7);
      const days = Array.from({ length: 7 }, (_, index) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + index);
        return day;
      });
      return {
        label:
          weekOffset === -1
            ? "Last week"
            : weekOffset === 0
              ? "Current week"
              : "Next week",
        monday,
        days,
      };
    });
  }, []);

  const memberWeeklyCalculations = useMemo(
    () =>
      currentSharedPeople.map((person) => ({
        ...person,
        weeks: weeklyPeriods.map((week) => {
          const selectedDays = week.days.filter((day) =>
            person.selectedDates.includes(localDateKey(day)),
          );
          return {
            ...week,
            selectedDays,
            total: selectedDays.length * TIFFIN_PRICE,
          };
        }),
      })),
    [currentSharedPeople, weeklyPeriods],
  );
  const memberTotalPages = Math.max(
    1,
    Math.ceil(memberWeeklyCalculations.length / MEMBERS_PER_PAGE),
  );
  const safeMemberPage = Math.min(memberPage, memberTotalPages - 1);
  const visibleMembers = memberWeeklyCalculations.slice(
    safeMemberPage * MEMBERS_PER_PAGE,
    (safeMemberPage + 1) * MEMBERS_PER_PAGE,
  );
  const dateTotalPages = Math.max(
    1,
    Math.ceil(residentRows.length / DATES_PER_PAGE),
  );
  const safeDatePage = Math.min(datePage, dateTotalPages - 1);
  const visibleResidentRows = residentRows.slice(
    safeDatePage * DATES_PER_PAGE,
    (safeDatePage + 1) * DATES_PER_PAGE,
  );

  async function requestAccess() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/tiffin", { method: "POST" });
    const body = await response.json().catch(() => null);
    if (!response.ok) setMessage(body?.error || "Could not send your request.");
    else setRequest(body.request);
    setBusy(false);
  }

  function toggleDate(date: Date) {
    if (!canEdit) return;
    const key = localDateKey(date);
    setSelectedDates((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function saveDates() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/tiffin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedDates: [...selectedDates].sort() }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) setMessage(body?.error || "Could not save your dates.");
    else {
      setRequest(body.request);
      setMessage("Your tiffin days are saved.");
    }
    setBusy(false);
  }

  const copy = request ? statusCopy(request.status) : null;
  return (
    <div className="space-y-6">
      {request ? (
        <Card className="border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]">
          <CardHeader className="border-b border-slate-100 px-6 py-5 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Your request
                </p>
                <CardTitle className="mt-2 text-2xl text-slate-950">
                  {copy?.label}
                </CardTitle>
                <p className="mt-2 text-sm text-slate-600">{copy?.text}</p>
              </div>
              <div className="rounded-full bg-slate-100 p-3 text-slate-600">
                {request.status === "approved" ? <Check /> : <Clock3 />}
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <Card className="overflow-hidden border-amber-200 bg-white shadow-[0_20px_60px_-30px_rgba(120,53,15,0.35)]">
          <CardContent className="p-8 sm:p-12">
            <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <Send />
            </div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Access request
            </p>
            <h2 className="text-2xl font-semibold text-slate-950">
              Request your place in the tiffin schedule
            </h2>
            <p className="mt-3 max-w-xl text-slate-600">
              Send one request to the PG manager. Once approved, you can choose
              the future days you need tiffin.
            </p>
            <Button
              className="mt-8 bg-amber-700 text-white hover:bg-amber-800"
              onClick={requestAccess}
              disabled={busy}
            >
              {busy ? "Sending..." : "Request access"}
            </Button>
            {message && <p className="mt-4 text-sm text-red-700">{message}</p>}
          </CardContent>
        </Card>
      )}

      <>
        <Card className="border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]">
          <CardHeader className="flex-row items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
            <div>
              <CardTitle className="text-xl text-slate-950">
                Shared tiffin schedule
              </CardTitle>
              <p className="mt-1 text-sm text-slate-600">
                {canEdit
                  ? "Select one future date at a time. Past dates are locked."
                  : "See how many approved residents selected each future date."}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPastData((value) => !value);
                  setDatePage(0);
                }}
              >
                {showPastData ? "Hide past data" : "Show past data"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous month"
                onClick={() =>
                  setMonthOffset((value) => Math.max(0, value - 1))
                }
                disabled={monthOffset === 0}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next month"
                onClick={() =>
                  setMonthOffset((value) => Math.min(2, value + 1))
                }
                disabled={monthOffset === 2}
              >
                <ChevronRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {monthDate.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
              {planningDates
                .slice(
                  monthOffset * 30,
                  Math.min((monthOffset + 1) * 30, planningDates.length),
                )
                .map((date) => {
                  const key = localDateKey(date);
                  const selected = selectedDates.has(key);
                  const residentsSelected = sharedNamesByDate[key] || [];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDate(date)}
                      disabled={!canEdit}
                      aria-pressed={selected}
                      className={`min-h-20 rounded-xl border p-2 text-left transition ${selected ? "border-amber-600 bg-amber-50 text-amber-950" : "border-slate-200 bg-white text-slate-700 hover:border-amber-400"} ${!canEdit ? "cursor-default" : ""}`}
                    >
                      <span className="block text-xs font-medium text-slate-500">
                        {date.toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                      <span className="mt-2 block text-lg font-semibold">
                        {date.getDate()}
                      </span>
                      {residentsSelected.length > 0 && (
                        <span className="mt-1 block text-[11px] font-medium text-emerald-700">
                          {residentsSelected.length}{" "}
                          {residentsSelected.length === 1
                            ? "resident"
                            : "residents"}
                        </span>
                      )}
                      {selected && (
                        <Check className="mt-1 size-4 text-amber-700" />
                      )}
                    </button>
                  );
                })}
            </div>
            {canEdit && (
              <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-950">
                    {selectedDates.size}
                  </strong>{" "}
                  tiffin {selectedDates.size === 1 ? "day" : "days"} selected
                </p>
                <Button
                  onClick={saveDates}
                  disabled={busy}
                  className="bg-amber-700 text-white hover:bg-amber-800"
                >
                  {busy ? "Saving..." : "Save tiffin days"}
                </Button>
              </div>
            )}
            <div className="mt-8 border-t border-slate-200 pt-8">
              <h3 className="text-xl font-semibold text-slate-950">
                Member calculations
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Each selected tiffin is Rs. {TIFFIN_PRICE}. Calculations run
                from Monday to Sunday.
              </p>
              <div className="mt-5 space-y-4">
                {memberWeeklyCalculations.length > 0 ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      {weeklyPeriods.map((week) => {
                        const total = memberWeeklyCalculations.reduce(
                          (sum, member) =>
                            sum +
                            member.weeks.find(
                              (item) => item.label === week.label,
                            )!.total,
                          0,
                        );
                        return (
                          <div
                            key={week.label}
                            className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {week.label}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {week.monday.toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}{" "}
                              -{" "}
                              {week.days[6].toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                            <p className="mt-3 text-lg font-bold text-amber-800">
                              All members: Rs. {total}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                      <div className="hidden grid-cols-[minmax(150px,1.2fr)_repeat(3,minmax(120px,1fr))] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                        <span>Member</span>
                        {weeklyPeriods.map((week) => (
                          <span key={week.label}>{week.label}</span>
                        ))}
                      </div>
                      {visibleMembers.map((member) => (
                        <div
                          key={member.name}
                          className="grid gap-3 border-b border-slate-100 p-4 last:border-0 md:grid-cols-[minmax(150px,1.2fr)_repeat(3,minmax(120px,1fr))] md:items-center"
                        >
                          <h4 className="wrap-break-word font-semibold text-slate-950">
                            {member.name}
                          </h4>
                          {member.weeks.map((week) => (
                            <div
                              key={week.label}
                              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 md:block"
                            >
                              <span className="text-xs font-medium text-slate-500 md:hidden">
                                {week.label}
                              </span>
                              <span className="text-sm font-semibold text-slate-900">
                                {week.selectedDays.length} days · Rs.{" "}
                                {week.total}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      Showing {safeMemberPage * MEMBERS_PER_PAGE + 1}–
                      {Math.min(
                        (safeMemberPage + 1) * MEMBERS_PER_PAGE,
                        memberWeeklyCalculations.length,
                      )}{" "}
                      of {memberWeeklyCalculations.length} members
                    </p>
                    <PaginationControls
                      page={safeMemberPage}
                      totalPages={memberTotalPages}
                      onPrevious={() =>
                        setMemberPage((page) => Math.max(0, page - 1))
                      }
                      onNext={() =>
                        setMemberPage((page) =>
                          Math.min(memberTotalPages - 1, page + 1),
                        )
                      }
                    />
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    No approved members are available for calculation.
                  </p>
                )}
              </div>
            </div>
            {message && (
              <p className="mt-4 text-sm text-emerald-700">{message}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.3)]">
          <CardHeader className="border-b border-slate-100 px-6 py-5 sm:px-8">
            <CardTitle className="text-xl text-slate-950">
              Residents by date
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              Everyone listed here has approved tiffin access.
            </p>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            {visibleResidentRows.length > 0 ? (
              <div className="space-y-3">
                {visibleResidentRows.map(({ date, names }) => {
                  return (
                    <div
                      key={date}
                      className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <span className="text-sm font-semibold text-slate-900">
                        {new Date(`${date}T00:00:00`).toLocaleDateString(
                          "en-IN",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: showPastData ? "numeric" : undefined,
                          },
                        )}
                      </span>
                      <span className="text-sm text-slate-600">
                        {names.join(", ")}
                      </span>
                    </div>
                  );
                })}
                <PaginationControls
                  page={safeDatePage}
                  totalPages={dateTotalPages}
                  onPrevious={() =>
                    setDatePage((page) => Math.max(0, page - 1))
                  }
                  onNext={() =>
                    setDatePage((page) =>
                      Math.min(dateTotalPages - 1, page + 1),
                    )
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No approved residents have selected a date in this view.
              </p>
            )}
          </CardContent>
        </Card>
      </>
      {!canEdit && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <LockKeyhole className="size-5 shrink-0" />
          Date selection becomes available after your request is approved.
        </div>
      )}
    </div>
  );
}
