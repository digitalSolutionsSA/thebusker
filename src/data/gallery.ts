export interface GalleryImage {
  id: string
  src: string
  alt: string
  tags: ('venue' | 'bok-town' | 'shows')[]
}

// Drop image files into public/gallery and add an entry here to have them show up
// in the Gallery sections on the Bok Town and Shows pages. Tag each image with where
// it should appear: 'venue' shows everywhere, 'bok-town' only on the Bok Town page,
// 'shows' only on the Shows page.
export const galleryImages: GalleryImage[] = []
