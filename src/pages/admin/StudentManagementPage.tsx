import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as api from "@/lib/api"

export function StudentManagementPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<api.AdminUser | null>(null)
  const [guardianSearch, setGuardianSearch] = useState("")
  const [selectedGuardian, setSelectedGuardian] = useState<api.AdminUser | null>(null)

  const students = useQuery({
    queryKey: ["users", "STUDENT"],
    queryFn: () => api.getUsers({ role: "STUDENT" }),
  })

  const guardians = useQuery({
    queryKey: ["users", "GUARDIAN"],
    queryFn: () => api.getUsers({ role: "GUARDIAN" }),
  })

  const linkGuardian = useMutation({
    mutationFn: () => api.linkGuardianToStudent(selectedStudent!.id, selectedGuardian!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "STUDENT"] })
      toast.success("Guardian linked")
      setSelectedGuardian(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const guardiansById = useMemo(() => {
    const map = new Map<string, api.AdminUser>()
    for (const g of guardians.data ?? []) map.set(g.id, g)
    return map
  }, [guardians.data])

  const filteredStudents = (students.data ?? []).filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  )

  const filteredGuardians = (guardians.data ?? []).filter((g) =>
    !guardianSearch || g.name.toLowerCase().includes(guardianSearch.toLowerCase()) || g.email.toLowerCase().includes(guardianSearch.toLowerCase())
  )

  const currentGuardianId: string | undefined = selectedStudent
    ? (selectedStudent as unknown as { guardianId: string | undefined }).guardianId
    : undefined
  const currentGuardian = currentGuardianId ? guardiansById.get(currentGuardianId) : undefined

  return (
    <div className="flex-1 p-xl max-w-7xl mx-auto w-full">
      <h1 className="font-headline-xl text-headline-xl text-primary mb-lg">Students</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-xl">
        <div className="lg:col-span-1 bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm">
          <div className="relative mb-4">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-11 pr-4 py-2 rounded-full border border-outline-variant/20 font-body-md text-body-md bg-surface-container-low outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filteredStudents.map((s) => {
              const sg = (s as unknown as { guardianId: string | undefined }).guardianId
              const guardian = sg ? guardiansById.get(sg) : undefined
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStudent(s); setSelectedGuardian(null) }}
                  className={`w-full text-left px-md py-sm rounded-full transition-all ${
                    selectedStudent?.id === s.id
                      ? "bg-primary-container text-on-primary-container"
                      : "hover:bg-surface-container text-on-surface"
                  }`}
                >
                  <p className="font-label-md text-label-md">{s.name}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {s.email} {guardian ? `· Guardian: ${guardian.name}` : ""}
                  </p>
                </button>
              )
            })}
            {filteredStudents.length === 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant text-center py-md">No students found</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <div className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm flex items-center justify-center min-h-[300px]">
              <p className="font-body-md text-body-md text-on-surface-variant">Select a student to manage</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-[32px] p-xl border border-outline-variant/10 shadow-sm">
                <h2 className="font-headline-md text-headline-md text-primary mb-1">{selectedStudent.name}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">{selectedStudent.email}</p>

                {currentGuardian && (
                  <div className="mb-4 p-md bg-surface-container-low rounded-full">
                    <h3 className="font-label-sm text-label-sm text-on-surface-variant mb-1">Current Guardian</h3>
                    <p className="font-label-md text-label-md text-on-surface">{currentGuardian.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{currentGuardian.email}</p>
                  </div>
                )}

                <h3 className="font-label-lg text-label-lg text-on-surface mb-3">
                  {currentGuardian ? "Change Guardian" : "Link Guardian"}
                </h3>
                <div className="relative mb-3">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    value={guardianSearch}
                    onChange={(e) => setGuardianSearch(e.target.value)}
                    placeholder="Search guardians..."
                    className="w-full pl-11 pr-4 py-2 rounded-full border border-outline-variant/20 font-body-md bg-surface-container-low outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1 max-h-[200px] overflow-y-auto mb-4">
                  {filteredGuardians.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGuardian(g)}
                      className={`w-full text-left px-md py-sm rounded-full transition-all ${
                        selectedGuardian?.id === g.id
                          ? "bg-primary-container text-on-primary-container"
                          : "hover:bg-surface-container text-on-surface"
                      }`}
                    >
                      <p className="font-label-md text-label-md">{g.name}</p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">{g.email}</p>
                    </button>
                  ))}
                  {filteredGuardians.length === 0 && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant text-center py-md">No guardians found</p>
                  )}
                </div>

                <button
                  onClick={() => linkGuardian.mutate()}
                  disabled={!selectedGuardian || linkGuardian.isPending}
                  className="bg-secondary-container text-white px-md py-2 rounded-full font-label-md disabled:opacity-50"
                >
                  {selectedGuardian ? `Link ${selectedGuardian.name}` : "Select a guardian"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
