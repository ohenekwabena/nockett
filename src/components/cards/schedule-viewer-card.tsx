"use client";

import React, { useState, useEffect } from "react";
import { generateSchedule, formatScheduleForDisplay, getScheduleStats, ScheduleData } from "@/lib/schedule-service";

export function ScheduleViewerCard() {
  const [schedule, setSchedule] = useState<ScheduleData[]>([]);
  const [formattedSchedule, setFormattedSchedule] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [seed, setSeed] = useState<number>(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      const generatedSchedule = generateSchedule(seed);
      setSchedule(generatedSchedule);
      setFormattedSchedule(formatScheduleForDisplay(generatedSchedule));
      setStats(getScheduleStats(generatedSchedule));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate schedule");
    } finally {
      setLoading(false);
    }
  }, [seed]);

  const handleRegenerate = () => {
    setSeed(Date.now() + Math.floor(Math.random() * 10000));
  };

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-center items-center h-32">
          <p className="text-gray-600 dark:text-gray-400">Generating schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-red-600 dark:text-red-400">
          <p className="font-semibold">Error generating schedule:</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Personnel Schedule</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">4-Week Shift Rotation</p>
        </div>
        <button
          onClick={handleRegenerate}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 font-semibold hover:bg-blue-700 transition text-sm"
        >
          Regenerate
        </button>
      </div>

      {/* Schedule Table */}
      <div className="overflow-x-auto mb-8">
        {Object.entries(formattedSchedule).map(([weekNum, weekData]: [string, any]) => (
          <div key={weekNum} className="mb-8">
            <div className="inline-block w-full">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th colSpan={2} rowSpan={2} className="border border-gray-300 p-2 text-center font-bold">
                      WEEK {weekNum}
                    </th>
                    {days.map((day, idx) => {
                      const dateObj = new Date(2026, 2, 2 + parseInt(weekNum) * 7 - 7 + idx);
                      const dateStr = dateObj.toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
                      return (
                        <th key={day} className="border border-gray-300 p-2 text-center font-bold">
                          <div>{dateStr}</div>
                          <div>{day.toUpperCase()}</div>
                        </th>
                      );
                    })}
                  </tr>
                  <tr className="bg-blue-900 text-white">
                    <th colSpan={2} className="border border-gray-300 p-1 text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {["DAY", "NIGHT"].map((shiftType) => (
                    <tr key={shiftType} className="bg-gray-100 dark:bg-gray-800">
                      <td
                        rowSpan={1}
                        className="border border-gray-300 p-2 font-bold text-gray-900 dark:text-gray-100 bg-gray-300 dark:bg-gray-700 text-center"
                      >
                        {shiftType}
                      </td>
                      <td className="border border-gray-300 p-2 font-bold text-gray-900 dark:text-gray-100 text-center bg-gray-300 dark:bg-gray-700 text-xs">
                        {shiftType === "DAY" ? "7am - 7pm" : "7pm - 7am"}
                      </td>
                      {days.map((day) => {
                        const dayData = weekData[day];
                        const personnel = shiftType === "DAY" ? dayData?.dayShift : dayData?.nightShift;
                        return (
                          <td
                            key={`${day}-${shiftType}`}
                            className="border border-gray-300 p-2 text-center text-gray-900 dark:text-gray-100 h-12"
                          >
                            <div className="text-xs font-semibold">{personnel?.join(" / ") || "-"}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Shift Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 dark:border-gray-600">
                <th className="text-left p-2 font-semibold text-gray-700 dark:text-gray-300">Personnel</th>
                <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">Day Shifts</th>
                <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">Night Shifts</th>
                <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">Total Hours</th>
                <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">Weeks w/ Day Shift</th>
                <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">Weeks w/ Night Shift</th>
                <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">Max Days/Week</th>
                <th className="text-center p-2 font-semibold text-gray-700 dark:text-gray-300">
                  Max Consecutive Nights
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats).map(([person, stat]: [string, any]) => (
                <tr
                  key={person}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <td className="p-2 text-gray-900 dark:text-gray-100 font-semibold">{person}</td>
                  <td className="p-2 text-center text-gray-700 dark:text-gray-300">{stat.totalDayShifts}</td>
                  <td className="p-2 text-center text-gray-700 dark:text-gray-300">{stat.totalNightShifts}</td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${stat.totalHours <= 180 ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}`}
                    >
                      {stat.totalHours}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${stat.weeksWithDayShift === 2 ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}`}
                    >
                      {stat.weeksWithDayShift}/4
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${stat.weeksWithNightShift === 2 ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}`}
                    >
                      {stat.weeksWithNightShift}/4
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${stat.maxWeeklyDays <= 4 ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}`}
                    >
                      {stat.maxWeeklyDays}
                    </span>
                  </td>
                  <td className="p-2 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${stat.maxConsecutiveNights <= 2 ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"}`}
                    >
                      {stat.maxConsecutiveNights}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Constraints Info */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-4 text-sm text-gray-700 dark:text-gray-300">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Schedule Constraints:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>No person works more than 2 consecutive night shifts</li>
          <li>Each week has 4 day-shift personnel and 4 night-shift personnel</li>
          <li>Each person works 2 weeks on day shift and 2 weeks on night shift</li>
          <li>One pair works 4 days and the other pair works 3 days per shift each week</li>
          <li>No person works more than 4 days in any week</li>
          <li>2-3 personnel on day shift and 2 personnel on night shift</li>
          <li>No person works more than 180 hours in the month</li>
          <li>Day shift: 7am - 7pm | Night shift: 7pm - 7am</li>
        </ul>
      </div>
    </div>
  );
}
