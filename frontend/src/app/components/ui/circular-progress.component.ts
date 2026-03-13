import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-circular-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column align-items-center gap-2">
      <div class="position-relative" [style.width.px]="size" [style.height.px]="size">
        <svg class="circular-progress" [attr.width]="size" [attr.height]="size">
          <!-- Background circle -->
          <circle
            [attr.cx]="size / 2"
            [attr.cy]="size / 2"
            [attr.r]="radius"
            fill="none"
            stroke="hsl(var(--muted))"
            [attr.stroke-width]="strokeWidth"
          />
          <!-- Progress circle -->
          <circle
            [attr.cx]="size / 2"
            [attr.cy]="size / 2"
            [attr.r]="radius"
            fill="none"
            [attr.stroke]="color"
            [attr.stroke-width]="strokeWidth"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="strokeDashoffset"
            stroke-linecap="round"
            class="transition-all"
          />
        </svg>
        <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
          <span class="fw-bold">{{ percentage }}%</span>
        </div>
      </div>
      <span class="small text-muted">{{ label }}</span>
      <span class="fw-semibold">{{ amount }}</span>
    </div>
  `,
  styles: [`
    .circular-progress {
      transform: rotate(-90deg);
    }
    .transition-all {
      transition: stroke-dashoffset 1s ease-out;
    }
  `]
})
export class CircularProgressComponent implements OnInit {
  @Input() percentage = 0;
  @Input() size = 100;
  @Input() strokeWidth = 8;
  @Input() label = '';
  @Input() amount = '';
  @Input() color = 'hsl(var(--primary))';

  radius = 0;
  circumference = 0;
  strokeDashoffset = 0;

  ngOnInit() {
    this.radius = (this.size - this.strokeWidth) / 2;
    this.circumference = this.radius * 2 * Math.PI;
    
    setTimeout(() => {
      this.strokeDashoffset = this.circumference - (this.percentage / 100) * this.circumference;
    }, 100);
  }
}