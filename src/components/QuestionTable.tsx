import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

const QuestionTable = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>#</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Level</TableHead>
          <TableHead className="">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">1</TableCell>
          <TableCell>Two Sum</TableCell>
          <TableCell>Easy</TableCell>
          <TableCell className="space-x-2">
            <Button variant="outline">Solve</Button>
            <Button variant="outline">Edit</Button>
            <Button variant="outline">Delete</Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">2</TableCell>
          <TableCell>Two Sum Two Sum Two Sum Two Sum Two Sum Two Sum</TableCell>
          <TableCell>Easy</TableCell>
          <TableCell className="space-x-2">
            <Button variant="outline">Solve</Button>
            <Button variant="outline">Edit</Button>
            <Button variant="outline">Delete</Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default QuestionTable;
