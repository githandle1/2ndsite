function run(input) {
  const data = input[0];
  const response = data.githubResponse;
  const bookmarks = JSON.parse(atob(response.content.replace(/\n/g, "")));
  const bookmark = {
    title: String(data.title || "").toLowerCase(),
    url: String(data.url || ""),
  };

  if (data.publication) {
    bookmark.publication = String(data.publication).toLowerCase();
  }
  if (data.author) {
    bookmark.author = String(data.author).toLowerCase();
  }

  if (bookmarks.some((item) => item.url === bookmark.url)) {
    return { skipped: true, title: bookmark.title };
  }

  bookmarks.push(bookmark);
  const text = JSON.stringify(bookmarks, null, 2) + "\n";
  const content = btoa(unescape(encodeURIComponent(text)));

  return {
    message: "Add bookmark: " + bookmark.title,
    content: content,
    sha: response.sha,
    title: bookmark.title,
  };
}
