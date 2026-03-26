import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function AdminDestinations() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Destinations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage destinations, prices, and availability.
          </p>
        </div>
        <Link href="/admin/add-destination">
          <Button variant="default">Add destination</Button>
        </Link>
      </div>

      <div className="space-y-4">
        <Input placeholder="Search destinations..." />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Manambato</CardTitle>
            <CardDescription>Active - 5 days / 4 nights</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Price from 450.000 AR</span>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ambila Lemaintso</CardTitle>
            <CardDescription>Active - 4 days</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Price from 300.000 AR</span>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sainte-Marie</CardTitle>
            <CardDescription>Active - 8 days</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Price 1.050.000 AR</span>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Le Grand Sud</CardTitle>
            <CardDescription>Active - 10 days</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Price 1.700.000 AR</span>
            <Button variant="outline" size="sm">
              Edit
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
