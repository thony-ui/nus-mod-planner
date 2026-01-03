import { SemesterModules } from "@/types/plan";
import {
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";

export function useDragDropSensors() {
  return useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
}

interface DragDropHandlerParams {
  event: DragEndEvent;
  semesterPlan: Record<string, SemesterModules[]>;
  onUpdate: (newPlan: Record<string, SemesterModules[]>) => Promise<void>;
}

export async function handleModuleDragEnd({
  event,
  semesterPlan,
  onUpdate,
}: DragDropHandlerParams) {
  const { active, over } = event;

  if (!over) return;

  // Extract semester and module info from IDs
  const activeId = active.id.toString();
  const overId = over.id.toString();

  // Parse active: "semester-moduleCode"
  const [activeSemester, activeModule] = activeId.split("-");
  const [overSemester, overModule] = overId.split("-");

  const mcs = semesterPlan[activeSemester].find(
    (m) => m.module === activeModule
  )?.mcs;

  if (!activeSemester || !activeModule || !overSemester) return;

  // If dragging to a different semester
  if (activeSemester !== overSemester) {
    const newSemesterPlan = { ...semesterPlan };

    // Remove from old semester
    newSemesterPlan[activeSemester] = (
      newSemesterPlan[activeSemester] || []
    ).filter((m) => m.module !== activeModule);

    // Add to new semester
    if (!newSemesterPlan[overSemester]) {
      newSemesterPlan[overSemester] = [];
    }

    // If dropping on another module, insert before it
    if (overModule) {
      const overIndex = newSemesterPlan[overSemester].findIndex(
        (m) => m.module === overModule
      );
      newSemesterPlan[overSemester].splice(overIndex, 0, {
        module: activeModule,
        mcs: mcs ?? 0,
      });
    } else {
      // If dropping on semester container, add to end
      newSemesterPlan[overSemester].push({
        module: activeModule,
        mcs: mcs ?? 0,
      });
    }

    await onUpdate(newSemesterPlan);
  } else {
    // Reordering within the same semester
    const modules = semesterPlan[activeSemester] || [];
    const oldIndex = modules.findIndex((m) => m.module === activeModule);
    const newIndex = overModule
      ? modules.findIndex((m) => m.module === overModule)
      : modules.length - 1;

    if (oldIndex !== newIndex) {
      const newModules = arrayMove(modules, oldIndex, newIndex);
      const newSemesterPlan = {
        ...semesterPlan,
        [activeSemester]: newModules,
      };

      await onUpdate(newSemesterPlan);
    }
  }
}
