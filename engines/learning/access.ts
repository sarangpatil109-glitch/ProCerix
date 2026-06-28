export function isContentPublished(item: { deleted_at: string | null }): boolean {
  return item.deleted_at === null;
}

export function canAccessContent(
  isEnrolled: boolean, 
  userRole: string = "user"
): boolean {
  if (userRole === "admin") return true;
  return isEnrolled;
}

export function isLessonUnlocked(
  lessonSequence: number,
  moduleSequence: number,
  previousLessonCompleted: boolean,
  requireSequential: boolean = true
): boolean {
  if (!requireSequential) return true;
  return previousLessonCompleted || (lessonSequence === 1 && moduleSequence === 1);
}
