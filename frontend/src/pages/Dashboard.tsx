import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UrlForm } from "@/components/urls/UrlForm";
import { UrlList } from "@/components/urls/UrlList";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Shorten a URL</CardTitle>
        </CardHeader>
        <CardContent>
          <UrlForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your URLs</CardTitle>
        </CardHeader>
        <CardContent>
          <UrlList />
        </CardContent>
      </Card>
    </div>
  );
}
