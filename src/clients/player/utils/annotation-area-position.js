export function getAreaSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const size = Math.min(width, height) * 0.7;
  const top = (height - size) / 2 + 60; // 60 is the header
  const left = (width - size) / 2;

  // console.log(size, left, top);
  return { size, left, top };
}

export function getSliderArea(sliderHeight) {
  const $header = document.querySelector('.header');
  const headerHeight = $header.getBoundingClientRect().height;

  const width = window.innerWidth;
  const height = window.innerHeight - headerHeight;
  const size = width * 0.8;
  const left = (width - size) / 2;
  const top = (height - sliderHeight) / 2;

  return { size, left, top };
}
