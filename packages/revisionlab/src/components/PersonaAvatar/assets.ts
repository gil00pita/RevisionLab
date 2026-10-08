// Literal URLs let host bundlers discover every packaged portrait without filesystem access.
export const personaAvatarImages: Record<
  string,
  { src: string; srcSet: string }
> = {
  "Avatar-01": {
    src: new URL("../../../assets/avatars/Avatar-01-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-01-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-01-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-02": {
    src: new URL("../../../assets/avatars/Avatar-02-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-02-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-02-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-03": {
    src: new URL("../../../assets/avatars/Avatar-03-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-03-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-03-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-04": {
    src: new URL("../../../assets/avatars/Avatar-04-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-04-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-04-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-05": {
    src: new URL("../../../assets/avatars/Avatar-05-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-05-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-05-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-06": {
    src: new URL("../../../assets/avatars/Avatar-06-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-06-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-06-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-07": {
    src: new URL("../../../assets/avatars/Avatar-07-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-07-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-07-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-08": {
    src: new URL("../../../assets/avatars/Avatar-08-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-08-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-08-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-09": {
    src: new URL("../../../assets/avatars/Avatar-09-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-09-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-09-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-10": {
    src: new URL("../../../assets/avatars/Avatar-10-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-10-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-10-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-11": {
    src: new URL("../../../assets/avatars/Avatar-11-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-11-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-11-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-12": {
    src: new URL("../../../assets/avatars/Avatar-12-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-12-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-12-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-13": {
    src: new URL("../../../assets/avatars/Avatar-13-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-13-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-13-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-14": {
    src: new URL("../../../assets/avatars/Avatar-14-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-14-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-14-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-15": {
    src: new URL("../../../assets/avatars/Avatar-15-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-15-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-15-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-16": {
    src: new URL("../../../assets/avatars/Avatar-16-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-16-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-16-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-17": {
    src: new URL("../../../assets/avatars/Avatar-17-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-17-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-17-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-18": {
    src: new URL("../../../assets/avatars/Avatar-18-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-18-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-18-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-19": {
    src: new URL("../../../assets/avatars/Avatar-19-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-19-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-19-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-20": {
    src: new URL("../../../assets/avatars/Avatar-20-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-20-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-20-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-21": {
    src: new URL("../../../assets/avatars/Avatar-21-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-21-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-21-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-22": {
    src: new URL("../../../assets/avatars/Avatar-22-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-22-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-22-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-23": {
    src: new URL("../../../assets/avatars/Avatar-23-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-23-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-23-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-24": {
    src: new URL("../../../assets/avatars/Avatar-24-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-24-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-24-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-25": {
    src: new URL("../../../assets/avatars/Avatar-25-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-25-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-25-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-26": {
    src: new URL("../../../assets/avatars/Avatar-26-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-26-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-26-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-27": {
    src: new URL("../../../assets/avatars/Avatar-27-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-27-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-27-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-28": {
    src: new URL("../../../assets/avatars/Avatar-28-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-28-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-28-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-29": {
    src: new URL("../../../assets/avatars/Avatar-29-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-29-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-29-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-30": {
    src: new URL("../../../assets/avatars/Avatar-30-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-30-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-30-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-31": {
    src: new URL("../../../assets/avatars/Avatar-31-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-31-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-31-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-32": {
    src: new URL("../../../assets/avatars/Avatar-32-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-32-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-32-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-33": {
    src: new URL("../../../assets/avatars/Avatar-33-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-33-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-33-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-34": {
    src: new URL("../../../assets/avatars/Avatar-34-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-34-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-34-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-35": {
    src: new URL("../../../assets/avatars/Avatar-35-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-35-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-35-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-36": {
    src: new URL("../../../assets/avatars/Avatar-36-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-36-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-36-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-37": {
    src: new URL("../../../assets/avatars/Avatar-37-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-37-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-37-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-38": {
    src: new URL("../../../assets/avatars/Avatar-38-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-38-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-38-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-39": {
    src: new URL("../../../assets/avatars/Avatar-39-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-39-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-39-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-40": {
    src: new URL("../../../assets/avatars/Avatar-40-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-40-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-40-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-41": {
    src: new URL("../../../assets/avatars/Avatar-41-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-41-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-41-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-42": {
    src: new URL("../../../assets/avatars/Avatar-42-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-42-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-42-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-43": {
    src: new URL("../../../assets/avatars/Avatar-43-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-43-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-43-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-44": {
    src: new URL("../../../assets/avatars/Avatar-44-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-44-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-44-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-45": {
    src: new URL("../../../assets/avatars/Avatar-45-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-45-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-45-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-46": {
    src: new URL("../../../assets/avatars/Avatar-46-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-46-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-46-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-47": {
    src: new URL("../../../assets/avatars/Avatar-47-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-47-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-47-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-48": {
    src: new URL("../../../assets/avatars/Avatar-48-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-48-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-48-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-49": {
    src: new URL("../../../assets/avatars/Avatar-49-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-49-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-49-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-50": {
    src: new URL("../../../assets/avatars/Avatar-50-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-50-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-50-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-51": {
    src: new URL("../../../assets/avatars/Avatar-51-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-51-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-51-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-52": {
    src: new URL("../../../assets/avatars/Avatar-52-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-52-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-52-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-53": {
    src: new URL("../../../assets/avatars/Avatar-53-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-53-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-53-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-54": {
    src: new URL("../../../assets/avatars/Avatar-54-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-54-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-54-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-55": {
    src: new URL("../../../assets/avatars/Avatar-55-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-55-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-55-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-56": {
    src: new URL("../../../assets/avatars/Avatar-56-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-56-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-56-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-57": {
    src: new URL("../../../assets/avatars/Avatar-57-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-57-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-57-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-58": {
    src: new URL("../../../assets/avatars/Avatar-58-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-58-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-58-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-59": {
    src: new URL("../../../assets/avatars/Avatar-59-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-59-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-59-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-60": {
    src: new URL("../../../assets/avatars/Avatar-60-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-60-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-60-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-61": {
    src: new URL("../../../assets/avatars/Avatar-61-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-61-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-61-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-62": {
    src: new URL("../../../assets/avatars/Avatar-62-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-62-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-62-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-63": {
    src: new URL("../../../assets/avatars/Avatar-63-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-63-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-63-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-64": {
    src: new URL("../../../assets/avatars/Avatar-64-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-64-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-64-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-65": {
    src: new URL("../../../assets/avatars/Avatar-65-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-65-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-65-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-66": {
    src: new URL("../../../assets/avatars/Avatar-66-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-66-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-66-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-67": {
    src: new URL("../../../assets/avatars/Avatar-67-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-67-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-67-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-68": {
    src: new URL("../../../assets/avatars/Avatar-68-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-68-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-68-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-69": {
    src: new URL("../../../assets/avatars/Avatar-69-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-69-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-69-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-70": {
    src: new URL("../../../assets/avatars/Avatar-70-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-70-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-70-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-71": {
    src: new URL("../../../assets/avatars/Avatar-71-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-71-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-71-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-72": {
    src: new URL("../../../assets/avatars/Avatar-72-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-72-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-72-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-73": {
    src: new URL("../../../assets/avatars/Avatar-73-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-73-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-73-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-74": {
    src: new URL("../../../assets/avatars/Avatar-74-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-74-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-74-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-75": {
    src: new URL("../../../assets/avatars/Avatar-75-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-75-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-75-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-76": {
    src: new URL("../../../assets/avatars/Avatar-76-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-76-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-76-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-77": {
    src: new URL("../../../assets/avatars/Avatar-77-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-77-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-77-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-78": {
    src: new URL("../../../assets/avatars/Avatar-78-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-78-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-78-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-79": {
    src: new URL("../../../assets/avatars/Avatar-79-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-79-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-79-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-80": {
    src: new URL("../../../assets/avatars/Avatar-80-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-80-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-80-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-81": {
    src: new URL("../../../assets/avatars/Avatar-81-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-81-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-81-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-82": {
    src: new URL("../../../assets/avatars/Avatar-82-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-82-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-82-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-83": {
    src: new URL("../../../assets/avatars/Avatar-83-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-83-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-83-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-84": {
    src: new URL("../../../assets/avatars/Avatar-84-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-84-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-84-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-85": {
    src: new URL("../../../assets/avatars/Avatar-85-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-85-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-85-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-86": {
    src: new URL("../../../assets/avatars/Avatar-86-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-86-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-86-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-87": {
    src: new URL("../../../assets/avatars/Avatar-87-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-87-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-87-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-88": {
    src: new URL("../../../assets/avatars/Avatar-88-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-88-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-88-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-89": {
    src: new URL("../../../assets/avatars/Avatar-89-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-89-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-89-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-90": {
    src: new URL("../../../assets/avatars/Avatar-90-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-90-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-90-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-91": {
    src: new URL("../../../assets/avatars/Avatar-91-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-91-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-91-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-92": {
    src: new URL("../../../assets/avatars/Avatar-92-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-92-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-92-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-93": {
    src: new URL("../../../assets/avatars/Avatar-93-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-93-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-93-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-94": {
    src: new URL("../../../assets/avatars/Avatar-94-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-94-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-94-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-95": {
    src: new URL("../../../assets/avatars/Avatar-95-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-95-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-95-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-96": {
    src: new URL("../../../assets/avatars/Avatar-96-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-96-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-96-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-97": {
    src: new URL("../../../assets/avatars/Avatar-97-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-97-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-97-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-98": {
    src: new URL("../../../assets/avatars/Avatar-98-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-98-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-98-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-99": {
    src: new URL("../../../assets/avatars/Avatar-99-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-99-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-99-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-100": {
    src: new URL("../../../assets/avatars/Avatar-100-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-100-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-100-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-101": {
    src: new URL("../../../assets/avatars/Avatar-101-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-101-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-101-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-102": {
    src: new URL("../../../assets/avatars/Avatar-102-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-102-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-102-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-103": {
    src: new URL("../../../assets/avatars/Avatar-103-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-103-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-103-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-104": {
    src: new URL("../../../assets/avatars/Avatar-104-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-104-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-104-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-105": {
    src: new URL("../../../assets/avatars/Avatar-105-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-105-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-105-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-106": {
    src: new URL("../../../assets/avatars/Avatar-106-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-106-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-106-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-107": {
    src: new URL("../../../assets/avatars/Avatar-107-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-107-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-107-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-108": {
    src: new URL("../../../assets/avatars/Avatar-108-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-108-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-108-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-109": {
    src: new URL("../../../assets/avatars/Avatar-109-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-109-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-109-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-110": {
    src: new URL("../../../assets/avatars/Avatar-110-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-110-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-110-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-111": {
    src: new URL("../../../assets/avatars/Avatar-111-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-111-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-111-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-112": {
    src: new URL("../../../assets/avatars/Avatar-112-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-112-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-112-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-113": {
    src: new URL("../../../assets/avatars/Avatar-113-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-113-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-113-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-114": {
    src: new URL("../../../assets/avatars/Avatar-114-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-114-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-114-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-115": {
    src: new URL("../../../assets/avatars/Avatar-115-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-115-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-115-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-116": {
    src: new URL("../../../assets/avatars/Avatar-116-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-116-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-116-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-117": {
    src: new URL("../../../assets/avatars/Avatar-117-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-117-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-117-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-118": {
    src: new URL("../../../assets/avatars/Avatar-118-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-118-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-118-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-119": {
    src: new URL("../../../assets/avatars/Avatar-119-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-119-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-119-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-120": {
    src: new URL("../../../assets/avatars/Avatar-120-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-120-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-120-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-121": {
    src: new URL("../../../assets/avatars/Avatar-121-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-121-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-121-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-122": {
    src: new URL("../../../assets/avatars/Avatar-122-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-122-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-122-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-123": {
    src: new URL("../../../assets/avatars/Avatar-123-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-123-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-123-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-124": {
    src: new URL("../../../assets/avatars/Avatar-124-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-124-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-124-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-125": {
    src: new URL("../../../assets/avatars/Avatar-125-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-125-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-125-2x.png", import.meta.url).href} 2x`,
  },
  "Avatar-126": {
    src: new URL("../../../assets/avatars/Avatar-126-2x.png", import.meta.url)
      .href,
    srcSet: `${new URL("../../../assets/avatars/Avatar-126-1x.png", import.meta.url).href} 1x, ${new URL("../../../assets/avatars/Avatar-126-2x.png", import.meta.url).href} 2x`,
  },
};
