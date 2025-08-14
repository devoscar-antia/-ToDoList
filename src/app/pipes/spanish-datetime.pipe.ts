import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'spanishDateTime',
  standalone: true
})
export class SpanishDateTimePipe implements PipeTransform {
  private months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  transform(value: string | Date, format: 'short' | 'long' = 'short'): string {
    if (!value) return '';

    const date = typeof value === 'string' ? new Date(value) : value;
    
    if (isNaN(date.getTime())) return '';

    const day = date.getDate();
    const month = format === 'long' ? this.months[date.getMonth()] : (date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Formatear hora en formato 12 horas
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    if (format === 'long') {
      return `${day} de ${month} de ${year}, ${displayHours}:${displayMinutes} ${ampm}`;
    } else {
      // Formato corto: DD/MM/YY, HH:MM AM/PM
      const shortYear = year.toString().slice(-2);
      return `${day}/${month}/${shortYear}, ${displayHours}:${displayMinutes} ${ampm}`;
    }
  }
}
