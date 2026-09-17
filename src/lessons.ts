// Flattens the API's nested campus/building/classroom/occupancy tree into a
// flat, search-friendly list of course lessons.
import type { OccupationsResponse } from "./api.ts";

export interface Lesson {
  idrichiesta: number;
  course: string;
  code: number;
  professors: string[];
  campusName: string;
  buildingName: string;
  buildingAddress: string;
  roomName: string;
  date: string;
  inizio: string;
  fine: string;
}

export function formatDate(date: string): string {
  return `${date.slice(6, 8)}/${date.slice(4, 6)}/${date.slice(0, 4)}`;
}

export function flattenLessons(data: OccupationsResponse): Lesson[] {
  const lessons: Lesson[] = [];
  for (const campus of data.campuses) {
    for (const building of campus.buildings) {
      for (const classroom of building.classrooms) {
        for (const slot of classroom.occupancy) {
          // Ignore exams/other occupancy types and any COURSE slot missing the fields
          // we need to render a ticket (defensive against partial upstream data).
          if (slot.category !== "COURSE") continue;
          if (slot.idrichiesta == null || !slot.course || slot.code == null || !slot.professors) continue;
          lessons.push({
            idrichiesta: slot.idrichiesta,
            course: slot.course,
            code: slot.code,
            professors: slot.professors,
            campusName: campus.name,
            buildingName: building.name,
            buildingAddress: building.address,
            roomName: classroom.name,
            date: data.date,
            inizio: slot.inizio,
            fine: slot.fine,
          });
        }
      }
    }
  }
  return lessons;
}
