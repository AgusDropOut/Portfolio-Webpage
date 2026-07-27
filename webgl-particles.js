(function () {
    const section = document.getElementById('projects');
    const canvas = document.getElementById('projects-stars');
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });

    if (!gl) {
        return;
    }

    const vsSource = `
        attribute vec2 a_position;
        attribute vec3 a_color;
        attribute float a_size;
        attribute float a_alpha;
        
        uniform vec2 u_resolution;
        
        varying vec3 v_color;
        varying float v_alpha;
        
        void main() {
            vec2 zeroToOne = a_position / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            
            gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
            gl_PointSize = a_size;
            
            v_color = a_color;
            v_alpha = a_alpha;
        }
    `;

    const fsSource = `
        precision mediump float;
        
        varying vec3 v_color;
        varying float v_alpha;
        
        void main() {
            vec2 pt = gl_PointCoord - vec2(0.5);
            if (dot(pt, pt) > 0.25) discard; 
            
            gl_FragColor = vec4(v_color, v_alpha);
        }
    `;

    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    const sizeLoc = gl.getAttribLocation(program, 'a_size');
    const alphaLoc = gl.getAttribLocation(program, 'a_alpha');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');

    const PARTICLE_COUNT = 1000;
    const floatsPerParticle = 7; 
    const particleData = new Float32Array(PARTICLE_COUNT * floatsPerParticle);
    const velocities = new Float32Array(PARTICLE_COUNT * 2);
    const baseSpeeds = new Float32Array(PARTICLE_COUNT);

    let mouseX = -1000;
    let mouseY = -1000;
    let mouseVx = 0;
    let mouseVy = 0;

    const palette = [
        [1.0, 1.0, 1.0],         
        [0.51, 0.85, 0.83],      
        [0.88, 0.15, 0.52]       
    ];

    function initParticles() {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            resetParticle(i, true);
        }
    }

    function resetParticle(index, randomY = false) {
        const offset = index * floatsPerParticle;
        const vOffset = index * 2;
        
        particleData[offset + 0] = Math.random() * canvas.width; 
        particleData[offset + 1] = randomY ? Math.random() * canvas.height : -(Math.random() * 50); 
        
        const color = palette[Math.floor(Math.random() * palette.length)];
        particleData[offset + 2] = color[0]; 
        particleData[offset + 3] = color[1]; 
        particleData[offset + 4] = color[2]; 
        
        particleData[offset + 5] = Math.random() * 4.0 + 2.0; 
        particleData[offset + 6] = Math.random() * 0.6 + 0.4; 
        
        velocities[vOffset + 0] = 0;
        velocities[vOffset + 1] = 0;
        baseSpeeds[index] = Math.random() * 1.5 + 0.5;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); 

    function resize() {
        const rect = section.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

    /* Tracks cursor position and calculates instantaneous velocity vector */
    window.addEventListener('mousemove', (e) => {
        const rect = section.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        mouseVx = currentX - mouseX;
        mouseVy = currentY - mouseY;
        
        mouseX = currentX;
        mouseY = currentY;
    });

    window.addEventListener('mouseleave', () => {
        mouseX = -1000;
        mouseY = -1000;
        mouseVx = 0;
        mouseVy = 0;
    });

    function render() {
        /* Applies friction to the cursor velocity vector */
        mouseVx *= 0.85;
        mouseVy *= 0.85;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const offset = i * floatsPerParticle;
            const vOffset = i * 2;
            
            let px = particleData[offset + 0];
            let py = particleData[offset + 1];
            let vx = velocities[vOffset + 0];
            let vy = velocities[vOffset + 1];
            
            const dx = px - mouseX;
            const dy = py - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 120.0;
            
            /* Transfers momentum based on distance and applies radial repulsion */
            if (dist < maxDist && dist > 0.0) {
                const force = (maxDist - dist) / maxDist;
                
                vx += (dx / dist) * force * 0.5;
                vy += (dy / dist) * force * 0.5;
                
                vx += mouseVx * force * 0.12;
                vy += mouseVy * force * 0.12;
            }
            
            vx *= 0.92;
            vy *= 0.92;
            
            px += vx;
            py += vy + baseSpeeds[i];
            
            if (py > canvas.height || px < -50.0 || px > canvas.width + 50.0 || py < -100.0) {
                resetParticle(i, false);
                continue;
            }
            
            particleData[offset + 0] = px;
            particleData[offset + 1] = py;
            velocities[vOffset + 0] = vx;
            velocities[vOffset + 1] = vy;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, particleData, gl.DYNAMIC_DRAW);

        gl.useProgram(program);
        gl.uniform2f(resolutionLoc, canvas.width, canvas.height);

        const stride = floatsPerParticle * 4;
        
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, stride, 0);
        
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, stride, 8);
        
        gl.enableVertexAttribArray(sizeLoc);
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, stride, 20);
        
        gl.enableVertexAttribArray(alphaLoc);
        gl.vertexAttribPointer(alphaLoc, 1, gl.FLOAT, false, stride, 24);

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, PARTICLE_COUNT);

        requestAnimationFrame(render);
    }

    window.addEventListener('resize', resize);
    
    resize();
    initParticles();
    requestAnimationFrame(render);
})();