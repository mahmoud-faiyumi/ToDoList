import { Component, computed, input, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { ToDoService } from '../../../shared/services/to-do.service';
import { Priority, Category } from '../../../models/todo.model';

@Component({
  selector: 'app-productivity-dashboard',
  imports: [TitleCasePipe],
  templateUrl: './productivity-dashboard.component.html',
  styleUrl: './productivity-dashboard.component.css'
})
export class ProductivityDashboardComponent {
  private readonly toDoService = inject(ToDoService);

  readonly isVisible = input(false);

  protected readonly stats = computed(() => this.toDoService.getProductivityStats());
  protected readonly overdueTasks = computed(() => this.toDoService.getOverdueTasks());
  protected readonly tasksDueToday = computed(() => this.toDoService.getTasksDueToday());

  protected readonly tasksByPriority = computed(() => {
    const items = this.toDoService.items();
    const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0, none: 0 };
    items.forEach(task => {
      if (task.priority) {
        priorityCounts[task.priority]++;
      } else {
        priorityCounts.none++;
      }
    });
    return priorityCounts;
  });

  protected readonly tasksByCategory = computed(() => {
    const items = this.toDoService.items();
    const categoryCounts: Record<Category | 'none', number> = {
      work: 0, personal: 0, shopping: 0, health: 0,
      finance: 0, learning: 0, travel: 0, other: 0, none: 0
    };
    items.forEach(task => {
      if (task.category) {
        categoryCounts[task.category]++;
      } else {
        categoryCounts.none++;
      }
    });
    return categoryCounts;
  });

  protected readonly completionRate = computed(() => {
    const { totalTasks, completedTasks } = this.stats();
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  });

  protected readonly averageCompletionTimeFormatted = computed(() => {
    const time = this.stats().averageCompletionTime;
    if (time === 0) return 'N/A';
    const hours = Math.floor(time / (1000 * 60 * 60));
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  });

  protected readonly productivityScore = computed(() => {
    const { totalTasks, completedTasks, overdueTasks } = this.stats();
    if (totalTasks === 0) return 100;
    const completionScore = (completedTasks / totalTasks) * 70;
    const overduePenalty = Math.min(overdueTasks * 12, 45);
    return Math.max(0, Math.round(completionScore - overduePenalty + 15));
  });

  protected readonly productivityLevel = computed(() => {
    const score = this.productivityScore();
    if (score >= 80) {
      return {
        level: 'Excellent',
        tone: 'excellent' as const,
        color: '#059669',
        icon: 'fa-star',
        tip: 'Strong pace — keep clearing overdue items early.'
      };
    }
    if (score >= 60) {
      return {
        level: 'Good',
        tone: 'good' as const,
        color: '#0d9488',
        icon: 'fa-thumbs-up',
        tip: 'Solid progress. Finish a few active tasks to climb higher.'
      };
    }
    if (score >= 40) {
      return {
        level: 'Fair',
        tone: 'fair' as const,
        color: '#d97706',
        icon: 'fa-bolt',
        tip: 'Focus on overdue work first — it weighs the score down.'
      };
    }
    return {
      level: 'Needs focus',
      tone: 'low' as const,
      color: '#dc2626',
      icon: 'fa-exclamation-triangle',
      tip: 'Complete overdue tasks and mark wins to raise this quickly.'
    };
  });

  protected readonly scoreBreakdown = computed(() => {
    const { totalTasks, completedTasks, overdueTasks } = this.stats();
    if (totalTasks === 0) {
      return {
        completionShare: 100,
        overdueShare: 0,
        completedTasks: 0,
        overdueTasks: 0,
        totalTasks: 0
      };
    }
    const completionShare = Math.round((completedTasks / totalTasks) * 100);
    return {
      completionShare,
      overdueShare: Math.min(100, overdueTasks * 12),
      completedTasks,
      overdueTasks,
      totalTasks
    };
  });

  protected readonly scoreRingStyle = computed(() => {
    const score = this.productivityScore();
    const color = this.productivityLevel().color;
    return {
      background: `conic-gradient(${color} 0deg, ${color} ${score * 3.6}deg, color-mix(in srgb, var(--text-primary) 8%, transparent) ${score * 3.6}deg)`
    };
  });

  protected formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  protected getPriorityIcon(priority: Priority): string {
    const icons = {
      urgent: 'fa-exclamation',
      high: 'fa-arrow-up',
      medium: 'fa-minus',
      low: 'fa-arrow-down'
    };
    return icons[priority];
  }

  protected getCategoryIcon(category: Category): string {
    const icons = {
      work: 'fa-briefcase',
      personal: 'fa-user',
      shopping: 'fa-shopping-cart',
      health: 'fa-heart',
      finance: 'fa-dollar-sign',
      learning: 'fa-graduation-cap',
      travel: 'fa-plane',
      other: 'fa-ellipsis-h'
    };
    return icons[category];
  }

  protected getCategoriesWithTasks(): Category[] {
    const categories: Category[] = ['work', 'personal', 'shopping', 'health', 'finance', 'learning', 'travel', 'other'];
    return categories.filter(category => this.tasksByCategory()[category] > 0);
  }

  protected priorityWidth(count: number): number {
    const total = this.stats().totalTasks;
    return total > 0 ? (count / total) * 100 : 0;
  }
}
