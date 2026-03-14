import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


const addDestination = () => {
  return (
    <div className="space-y-4">
      <div className="items-center justify-between mx-auto w-full max-w-[800px] px-4 py-10">

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Add Destination
        </h1>

        <div className="flex flex-col gap-2">
          <label htmlFor="destination-name" className="text-sm font-medium text-foreground">
            Nom de la destination
          </label>
          <Input
            type="text"
            id="destination-name"
            placeholder="Entrez le nom de la destination"
            className="border-Input bg-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:outline-none border rounded-md px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="pays" className="text-sm font-medium text-foreground">
            Pays
          </label>
          <Input
            type="text"
            id="pays"
            placeholder="Entrez le nom du pays"
            className="border-Input bg-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:outline-none border rounded-md px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="ville" className="text-sm font-medium text-foreground">
            Ville
          </label>
          <Input
            type="text"
            id="ville"
            placeholder="Entrez le nom de la ville"
            className="border-Input bg-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:outline-none border rounded-md px-3 py-2"
          />
        </div>


        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            Description
          </label>
          <Input
            type="textarea"
            id="d"
            placeholder="Entrez le nom de la destination"
            className="border-Input bg-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:outline-none border rounded-md px-3 py-2"
          />
        </div>

        <Button variant="outline" className="mt-4">
          Ajouter la destination
        </Button>

      </div>
      </div>
      )};

export default addDestination;    