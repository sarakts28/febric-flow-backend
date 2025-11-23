// Get difference days from today to due date
export const getDifferenceDays = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate); // convert to Date object

    // Check if conversion worked
    if (isNaN(due)) {
        console.error('Invalid due date:', dueDate);
        return null;
    }

    const diffTime = due - today; // difference in milliseconds
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
