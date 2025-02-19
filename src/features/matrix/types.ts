export interface MatrixConfig {
  columns: number;
  rows: number;
  animationSpeed: number;
  fallSpeed: number;
  density: number;
  glowIntensity: number;
  maxRaindrops: number;
}

export interface Raindrop {
  column: number;
  length: number;
  speed: number;
  head: number; // Position of the raindrop head
  glowPosition: number; // Integer position for glow effect
  active: boolean;
  brightnesses: number[];
}

// Define default configuration
export const DEFAULT_CONFIG: MatrixConfig = {
  columns: 80,
  rows: 24,
  animationSpeed: 2,    // Double the animation speed
  fallSpeed: 2.5,       // Increase fall speed
  density: 0.8,         // Higher density for more raindrops
  glowIntensity: 0.8,
  maxRaindrops: 100,    // Double the maximum raindrops
};

// Define the character set for the Matrix rain
export const MATRIX_CHARS =
  'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';