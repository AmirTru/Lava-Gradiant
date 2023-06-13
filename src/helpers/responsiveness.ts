export function resizeRendererToDisplaySize(
  renderer: THREE.WebGLRenderer,
  composer: EffectComposer
) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    composer.setSize(width, height, false);
    renderer.setSize(width, height, false);
  }
  return needResize;
}
