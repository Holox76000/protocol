import { redirect } from "next/navigation";

export default function ProtocolIndexPage({ params }: { params: { email: string } }) {
  redirect(`/protocol/${params.email}/summary`);
}
