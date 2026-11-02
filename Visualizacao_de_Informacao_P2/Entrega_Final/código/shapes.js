// Original artwork by José Antunes. Filenames are case-sensitive on GitHub Pages.
export const shapeIcons = Object.freeze({
  fireball: "bola_de_fogo.png",
  cylinder: "cilindro.png",
  circle: "circulo.png",
  disk: "disco.png",
  sphere: "esfera.png",
  light: "luz.png",
  oval: "oval.png",
  triangle: "Triangulo.png",
});
export function shapeIcon(shape) {
  return `./images/${Object.hasOwn(shapeIcons, shape) ? shapeIcons[shape] : "outro.png"}`;
}
export function iconImage(shape) {
  const image = document.createElement("img");
  image.src = shapeIcon(shape);
  image.alt = "";
  image.className = "shape-icon";
  return image;
}
