import { Button } from "@heroui/react";
import type { FC } from "react";

export const App: FC = () => {
	return (
		<div className="flex h-screen items-center justify-center">
			<h1 className="text-4xl font-bold">Hello, world!</h1>
            <Button variant="primary">
                Click me!
            </Button>
		</div>
	);
};
