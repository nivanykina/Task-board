export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'backlogTitle' | 'inProgressTitle' | 'completedTitle';
  estimate: number;
  assignee: string;
  reporter: string;
  labels: string[];
  sprint: string;
  priority: 'Low' | 'Medium' | 'High';
}
