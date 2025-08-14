import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'spanishDate',
  standalone: true
})
export class SpanishDatePipe implements PipeTransform {
  private months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  private shortMonths = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
  ];

  transform(value: string | Date, format: 'short' | 'long' | 'time' | 'relative' = 'short'): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    
    if (isNaN(date.getTime())) return '';

    switch (format) {
      case 'long':
        return this.formatLong(date);
      case 'time':
        return this.formatTime(date);
      case 'relative':
        return this.formatRelative(date);
      default:
        return this.formatShort(date);
    }
  }

  private formatShort(date: Date): string {
    const day = date.getDate();
    const month = this.shortMonths[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  }

  private formatLong(date: Date): string {
    const day = date.getDate();
    const month = this.months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} de ${month} de ${year}`;
  }

  private formatTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  private formatRelative(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'hoy';
    } else if (diffInDays === 1) {
      return 'ayer';
    } else if (diffInDays === -1) {
      return 'mañana';
    } else if (diffInDays > 1 && diffInDays < 7) {
      return `hace ${diffInDays} días`;
    } else if (diffInDays < -1 && diffInDays > -7) {
      return `en ${Math.abs(diffInDays)} días`;
    } else {
      return this.formatShort(date);
    }
  }
}
