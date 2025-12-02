export function smoothScrollTo(elementId: string, offset: number = 80) {
  const element = document.querySelector(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }
}

export function handleSmoothScrollClick(e: React.MouseEvent<HTMLAnchorElement>, href: string, offset: number = 80) {
  e.preventDefault();
  smoothScrollTo(href, offset);
}


