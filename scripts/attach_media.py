"""Mock imtihon bo'limiga audio biriktirish (admin API orqali).

Foydalanish:
  python scripts/attach_media.py --api http://localhost:8080 --email admin@... --password ... \
      --exam-code IELTS_AC_MOCK_1 --section Listening --file scripts/listening/ielts-mock1.wav
"""
import argparse, json, mimetypes, os, sys, urllib.request, urllib.error, uuid


def req(api, method, path, token=None, body=None):
    h = {}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        h["Content-Type"] = "application/json"
    if token:
        h["Authorization"] = f"Bearer {token}"
    r = urllib.request.Request(api + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(r) as resp:
        c = resp.read()
        return json.loads(c) if c else None


def upload(api, token, path, kind):
    ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
    boundary = "----es" + uuid.uuid4().hex
    with open(path, "rb") as f:
        content = f.read()
    body = b"".join([
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"kind\"\r\n\r\n{kind}\r\n".encode(),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{os.path.basename(path)}\"\r\nContent-Type: {ctype}\r\n\r\n".encode(),
        content, f"\r\n--{boundary}--\r\n".encode(),
    ])
    r = urllib.request.Request(api + "/api/admin/media", data=body, method="POST",
                               headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read())


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--api", default="http://localhost:8080")
    p.add_argument("--email", required=True)
    p.add_argument("--password", required=True)
    p.add_argument("--exam-code", required=True)
    p.add_argument("--section", required=True, help="bo'lim nomi (masalan Listening)")
    p.add_argument("--file", required=True)
    a = p.parse_args()

    token = req(a.api, "POST", "/api/auth/login", body={"email": a.email, "password": a.password})["accessToken"]
    exams = req(a.api, "GET", "/api/admin/exams", token)
    exam = next((e for e in exams if e["code"] == a.exam_code), None)
    if not exam:
        sys.exit(f"Imtihon topilmadi: {a.exam_code}")
    detail = req(a.api, "GET", f"/api/admin/exams/{exam['id']}", token)
    sec = next((s for s in detail["sections"] if s["title"].lower() == a.section.lower()), None)
    if not sec:
        sys.exit(f"Bo'lim topilmadi: {a.section}; mavjud: {[s['title'] for s in detail['sections']]}")
    up = upload(a.api, token, a.file, "AUDIO")
    print("yuklandi:", up["key"], up["size"], "bayt")
    req(a.api, "PUT", f"/api/admin/exams/sections/{sec['id']}", token, {
        "title": sec["title"], "partType": sec["partType"], "orderIndex": sec["orderIndex"], "durationMinutes": sec["durationMinutes"],
        "instructions": sec["instructions"], "defaultPoints": sec["defaultPoints"], "audioKey": up["key"],
    })
    print(f"biriktirildi: {a.exam_code} / {sec['title']}")


if __name__ == "__main__":
    main()
