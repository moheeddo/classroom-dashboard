/* ═══════════════════════════════════════════════
   계절별 파티클 시스템 (Canvas 기반)
═══════════════════════════════════════════════ */

class ParticleSystem {
  constructor() {
    this.canvas = document.getElementById('particles-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this.particles = [];
    this.season = 'spring';
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setSeason(season) {
    this.season = season;
    this.particles = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 18000);
    for (let i = 0; i < Math.min(count, 120); i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(random = false) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const base = {
      x: random ? Math.random() * w : Math.random() * w,
      y: random ? Math.random() * h : -30,
      size: 0,
      speed: 0,
      drift: 0,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      opacity: Math.random() * 0.7 + 0.2,
      opacitySpeed: (Math.random() * 0.005 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
      color: '#fff',
      type: 'circle',
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.01,
      wobbleAmp: Math.random() * 2 + 1,
    };

    switch (this.season) {
      case 'spring':
        return {
          ...base,
          size: Math.random() * 18 + 8,
          speed: Math.random() * 1.5 + 0.5,
          drift: (Math.random() - 0.5) * 1.5,
          color: ['#ffb7c5', '#ffc8d5', '#ffe4ec', '#f8b4d9', '#e8c5f5'][Math.floor(Math.random() * 5)],
          type: 'petal',
        };
      case 'summer':
        return {
          ...base,
          size: Math.random() * 6 + 2,
          speed: Math.random() * 0.8 + 0.3,
          drift: (Math.random() - 0.5) * 0.5,
          color: ['#40e0ff', '#00bcd4', '#80deea', '#ffffff', '#b2ff59'][Math.floor(Math.random() * 5)],
          type: 'bubble',
          rising: true,
          y: random ? Math.random() * h : h + 30,
        };
      case 'autumn':
        return {
          ...base,
          size: Math.random() * 20 + 10,
          speed: Math.random() * 2 + 1,
          drift: (Math.random() - 0.5) * 3,
          color: ['#ff7043', '#ffb347', '#ffd54f', '#8d6e63', '#ef9a9a'][Math.floor(Math.random() * 5)],
          type: 'leaf',
          rotSpeed: (Math.random() - 0.5) * 0.1,
        };
      case 'winter':
        return {
          ...base,
          size: Math.random() * 10 + 3,
          speed: Math.random() * 1.2 + 0.3,
          drift: (Math.random() - 0.5) * 1,
          color: ['#e0f7fa', '#90caf9', '#b39ddb', '#ffffff', '#cce5ff'][Math.floor(Math.random() * 5)],
          type: 'snowflake',
          rotSpeed: (Math.random() - 0.5) * 0.02,
        };
      default:
        return base;
    }
  }

  drawPetal(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawBubble(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.opacity * 0.7;
    const grad = ctx.createRadialGradient(-p.size * 0.3, -p.size * 0.3, 0, 0, 0, p.size);
    grad.addColorStop(0, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.5, p.color + '40');
    grad.addColorStop(1, p.color + '20');
    ctx.fillStyle = grad;
    ctx.strokeStyle = p.color + '80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawLeaf(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -p.size);
    ctx.bezierCurveTo(p.size * 0.8, -p.size * 0.5, p.size * 0.8, p.size * 0.5, 0, p.size);
    ctx.bezierCurveTo(-p.size * 0.8, p.size * 0.5, -p.size * 0.8, -p.size * 0.5, 0, -p.size);
    ctx.fill();
    // 잎맥
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -p.size * 0.8);
    ctx.lineTo(0, p.size * 0.8);
    ctx.stroke();
    ctx.restore();
  }

  drawSnowflake(ctx, p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = Math.max(1, p.size * 0.12);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, p.size);
      ctx.stroke();
      // 가지
      ctx.beginPath();
      ctx.moveTo(0, p.size * 0.4);
      ctx.lineTo(p.size * 0.25, p.size * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p.size * 0.4);
      ctx.lineTo(-p.size * 0.25, p.size * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  update() {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.particles.forEach(p => {
      p.wobble += p.wobbleSpeed;
      p.rotation += p.rotSpeed;
      p.opacity += p.opacitySpeed;
      if (p.opacity > 0.9 || p.opacity < 0.1) p.opacitySpeed *= -1;

      if (this.season === 'summer') {
        p.y -= p.speed;
        p.x += Math.sin(p.wobble) * p.wobbleAmp;
        if (p.y < -p.size * 2) {
          p.y = h + p.size;
          p.x = Math.random() * w;
        }
      } else {
        p.y += p.speed;
        p.x += p.drift + Math.sin(p.wobble) * p.wobbleAmp;
        if (p.y > h + p.size * 2) {
          p.y = -p.size;
          p.x = Math.random() * w;
        }
        if (p.x < -p.size * 2) p.x = w + p.size;
        if (p.x > w + p.size * 2) p.x = -p.size;
      }
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      switch (p.type) {
        case 'petal':     this.drawPetal(ctx, p);     break;
        case 'bubble':    this.drawBubble(ctx, p);    break;
        case 'leaf':      this.drawLeaf(ctx, p);      break;
        case 'snowflake': this.drawSnowflake(ctx, p); break;
        default:
          ctx.save();
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
      }
    });
  }

  start() {
    const loop = () => {
      this.update();
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

// 전역 인스턴스
window.particleSystem = new ParticleSystem();
