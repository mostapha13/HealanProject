from __future__ import annotations
from html.parser import HTMLParser
import html
import re

_BLOCK_TAGS = {
    "address","article","aside","blockquote","br","div","dl","dt","dd","fieldset","figcaption",
    "figure","footer","form","h1","h2","h3","h4","h5","h6","header","hr","li","main","nav",
    "ol","p","pre","section","table","tbody","td","tfoot","th","thead","tr","ul"
}
_SKIP_TAGS = {"script","style","noscript","svg","canvas","template"}

class _PlainTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        tag=tag.lower()
        if tag in _SKIP_TAGS:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        if tag in _BLOCK_TAGS:
            self.parts.append("\n")
        if tag == "li":
            self.parts.append("• ")

    def handle_endtag(self, tag: str) -> None:
        tag=tag.lower()
        if tag in _SKIP_TAGS:
            if self.skip_depth:
                self.skip_depth -= 1
            return
        if self.skip_depth:
            return
        if tag in _BLOCK_TAGS:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if not self.skip_depth and data:
            self.parts.append(data)


def html_to_text(value: str) -> str:
    """Deterministic HTML -> plain text. No network access, script/style content is discarded."""
    value=(value or "").replace("<\\br>","<br>")
    if "<" not in value and "&" not in value:
        text=value
    else:
        parser=_PlainTextParser()
        try:
            parser.feed(value)
            parser.close()
            text="".join(parser.parts)
        except Exception:
            # Fail safe: strip tags instead of returning raw executable markup.
            text=re.sub(r"<[^>]+>"," ",value)
        text=html.unescape(text)
    text=text.replace("\xa0"," ").replace("\u200e","").replace("\u200f","")
    text=re.sub(r"[ \t\r\f\v]+"," ",text)
    text=re.sub(r" *\n *","\n",text)
    text=re.sub(r"\n{3,}","\n\n",text)
    return text.strip()
