var PortalVertexShader = `
              varying vec4 vWorldPos; 
              void main() {  
              vWorldPos = modelMatrix * vec4(position, 1.0);
              gl_Position = projectionMatrix * viewMatrix * vWorldPos;
              }
            `;
var PortalFragmentShader = `
        uniform mat4 cameraMatrix;
        uniform mat4 projMatrix;
        uniform sampler2D viewFromPortal;
        varying vec4 vWorldPos; 
        void main() { 
        vec4 texc = projMatrix * cameraMatrix * vWorldPos;
        vec2 uv = texc.xy / texc.w / 2.0 + 0.5;
        vec3 color = ( max(uv.x, uv.y) <= 1. && min(uv.x, uv.y) >= 0.) ? texture2D(viewFromPortal, uv).rgb : vec3(0.0, 0.0, 0.0);
        gl_FragColor = vec4(color, 1.0); 
        }
      `;

export { PortalVertexShader, PortalFragmentShader };