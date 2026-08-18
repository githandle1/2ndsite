function run(input) {
  const data = input[0];
  const response = data.githubResponse;
  const albums = JSON.parse(atob(response.content.replace(/\n/g, "")));
  const monthLabel = String(data.monthLabel || "").toLowerCase();
  const city = String(data.city || "nyc").toLowerCase();
  const caption = String(data.caption || "").toLowerCase().trim();
  const src = String(data.src || "");
  const photo = {
    src: src,
    alt: caption || "Photo, " + monthLabel,
    caption: caption ? caption + ", " + monthLabel : monthLabel,
    ariaLabel: "Open " + (caption || "photo"),
  };

  let found = false;
  for (const album of albums) {
    if (album.label !== monthLabel) {
      continue;
    }
    album.groups = album.groups || [];
    let group = album.groups.find((item) => item.city === city);
    if (!group) {
      group = { city: city, photos: [] };
      album.groups.unshift(group);
    }
    group.photos = group.photos || [];
    group.photos.unshift(photo);
    found = true;
    break;
  }

  if (!found) {
    albums.unshift({
      label: monthLabel,
      preview: 2,
      groups: [{ city: city, photos: [photo] }],
    });
  }

  const text = JSON.stringify(albums, null, 2) + "\n";
  const content = btoa(unescape(encodeURIComponent(text)));

  return {
    message: "Add photo: " + (caption || src),
    content: content,
    sha: response.sha,
    caption: photo.caption,
  };
}
