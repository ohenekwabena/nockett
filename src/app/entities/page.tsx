import AssigneesCard from "@/components/cards/assignees-card";
import CategoriesCard from "@/components/cards/categories-card";
import DepartmentsCard from "@/components/cards/departments-card";
import PrioritiesCard from "@/components/cards/priorities-card";
import RolesCard from "@/components/cards/roles-card";

export default function EntitiesPage() {
    return (
        <div className="pr-6 mt-10">
            <h1 className="font-bold mb-4 text-gray-900 dark:text-gray-100"
                style={{
                    fontSize: "clamp(2rem, 9.3vw - 2.1rem, 3.75rem)"
                }}
            >
                Entities
            </h1>
            {/* Entities content goes here */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 w-full">
                <CategoriesCard />
                <PrioritiesCard />
                <AssigneesCard />
                <RolesCard />
                <DepartmentsCard />
                {/* Add more entity cards as needed */}
            </div>
        </div>
    );
}