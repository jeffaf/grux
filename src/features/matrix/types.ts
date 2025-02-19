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
  animationSpeed: 1,
  fallSpeed: 1,
  density: 0.5, // Reduced for better performance
  glowIntensity: 0.8,
  maxRaindrops: 50, // Limit for performance
};

// Define the character set for the Matrix rain
export const MATRIX_CHARS =
  'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂッツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロヮワヰヱヲンヴヵヶｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟあいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';