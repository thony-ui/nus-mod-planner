import jsPDF from "jspdf";

interface SemesterPlan {
  [semester: string]: string[];
}

interface PlanData {
  name: string;
  programme: string;
  semesterPlan: SemesterPlan;
  minMcPerSemester?: number;
  maxMcPerSemester?: number;
}

export async function exportPlanToPDF(
  planData: PlanData,
  fileName: string
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const marginLeft = 20;
    const marginRight = 20;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let yPosition = 20;

    // Header Section
    pdf.setFillColor(243, 244, 246); // Light grey header
    pdf.rect(0, 0, pageWidth, 50, "F");

    pdf.setTextColor(31, 41, 55);
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text(planData.name, marginLeft, 20);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(planData.programme, marginLeft, 30);

    // Add MC constraints if available
    if (
      planData.minMcPerSemester !== undefined &&
      planData.maxMcPerSemester !== undefined
    ) {
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128); // Medium gray
      pdf.text(
        `MC Range: ${planData.minMcPerSemester} - ${planData.maxMcPerSemester} per semester`,
        marginLeft,
        40
      );
    }

    yPosition = 65;
    pdf.setTextColor(0, 0, 0);

    // Sort semesters
    const semesters = Object.keys(planData.semesterPlan).sort();

    semesters.forEach((semester, index) => {
      const modules = planData.semesterPlan[semester] || [];
      const moduleCount = modules.length;
      const estimatedHeight = 15 + moduleCount * 8;

      // Check if we need a new page
      if (yPosition + estimatedHeight > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }

      // Semester header with background
      pdf.setFillColor(243, 244, 246); // Light gray
      pdf.roundedRect(marginLeft, yPosition - 5, contentWidth, 12, 2, 2, "F");

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(31, 41, 55); // Dark gray
      pdf.text(semester, marginLeft + 5, yPosition + 3);

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128); // Medium gray
      pdf.text(
        `${moduleCount} module${moduleCount !== 1 ? "s" : ""}`,
        pageWidth - marginRight - 30,
        yPosition + 3
      );

      yPosition += 15;

      // Module list
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);

      modules.forEach((module, idx) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        // Alternating row background
        if (idx % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(marginLeft, yPosition - 4, contentWidth, 7, "F");
        }

        pdf.setTextColor(0, 0, 0);
        pdf.text(`• ${module}`, marginLeft + 5, yPosition);
        yPosition += 8;
      });

      yPosition += 8; // Space between semesters
    });

    // Footer on last page
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(156, 163, 175);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
        align: "center",
      });
    }

    pdf.save(fileName);
  } catch (error) {
    console.error("Failed to export PDF:", error);
    throw error;
  }
}
